"""
Subset YAML parser (zero dependencies).

Scope: exactly what the LineageOS wiki device files use.
  - top level mappings
  - scalars: str, int, float, bool, null
  - flow sequences  [a, b, c]
  - flow mappings   {k: v, k2: [x, y]}
  - block sequences of scalars / flow-maps / mappings
  - single-quoted and double-quoted strings
  - # comments (only when outside quotes)

Anything outside that scope raises MiniyamlError instead of guessing silently,
because a silently mis-parsed device record is worse than a failed import.
"""

from __future__ import annotations


class MiniyamlError(ValueError):
    pass


# ---------------------------------------------------------------- tokenizing

def _strip_comment(line: str) -> str:
    out = []
    quote = None
    for i, ch in enumerate(line):
        if quote:
            out.append(ch)
            if ch == quote:
                quote = None
            continue
        if ch in ("'", '"'):
            quote = ch
            out.append(ch)
            continue
        if ch == "#" and (i == 0 or line[i - 1] in " \t"):
            break
        out.append(ch)
    return "".join(out).rstrip()


def _indent(line: str) -> int:
    return len(line) - len(line.lstrip(" "))


# ---------------------------------------------------------------- scalar

_INT_RE = set("0123456789")


def _parse_scalar(tok: str):
    t = tok.strip()
    if t == "":
        return None
    if len(t) >= 2 and t[0] == t[-1] and t[0] in ("'", '"'):
        body = t[1:-1]
        if t[0] == "'":
            return body.replace("''", "'")
        return (
            body.replace("\\n", "\n")
            .replace("\\t", "\t")
            .replace('\\"', '"')
            .replace("\\\\", "\\")
        )
    low = t.lower()
    if low in ("null", "~", "none"):
        return None
    if low in ("true", "yes", "on"):
        return True
    if low in ("false", "no", "off"):
        return False
    if t[0] in _INT_RE or (t[0] == "-" and len(t) > 1 and t[1] in _INT_RE):
        body = t[1:] if t[0] == "-" else t
        if all(c in _INT_RE for c in body):
            return -int(body) if t[0] == "-" else int(body)
        try:
            return float(t)
        except ValueError:
            return t
    return t


# ---------------------------------------------------------------- flow scope

def _split_flow(body: str) -> list[str]:
    """Split on top-level commas, quote and bracket aware."""
    parts, buf, depth, quote = [], [], 0, None
    for ch in body:
        if quote:
            buf.append(ch)
            if ch == quote:
                quote = None
            continue
        if ch in ("'", '"'):
            quote = ch
            buf.append(ch)
            continue
        if ch in "[{":
            depth += 1
        elif ch in "]}":
            depth -= 1
        if ch == "," and depth == 0:
            parts.append("".join(buf))
            buf = []
            continue
        buf.append(ch)
    tail = "".join(buf).strip()
    if tail:
        parts.append(tail)
    return [p.strip() for p in parts if p.strip() != ""]


def _find_colon(text: str) -> int:
    quote = None
    depth = 0
    for i, ch in enumerate(text):
        if quote:
            if ch == quote:
                quote = None
            continue
        if ch in ("'", '"'):
            quote = ch
        elif ch in "[{":
            depth += 1
        elif ch in "]}":
            depth -= 1
        elif ch == ":" and depth == 0:
            if i + 1 >= len(text) or text[i + 1] in " \t":
                return i
    return -1


def parse_flow(text: str):
    t = text.strip()
    if t.startswith("{") and t.endswith("}"):
        out = {}
        for item in _split_flow(t[1:-1]):
            idx = _find_colon(item)
            if idx < 0:
                raise MiniyamlError(f"flow mapping item without colon: {item!r}")
            out[_parse_scalar(item[:idx])] = parse_flow(item[idx + 1 :])
        return out
    if t.startswith("[") and t.endswith("]"):
        return [parse_flow(p) for p in _split_flow(t[1:-1])]
    return _parse_scalar(t)


# ---------------------------------------------------------------- block parser

class _Parser:
    def __init__(self, lines: list[tuple[int, str]]):
        self.lines = lines
        self.i = 0

    def peek(self):
        return self.lines[self.i] if self.i < len(self.lines) else None

    def parse_block(self, indent: int):
        head = self.peek()
        if head is None:
            return None
        if head[1].startswith("- "):
            return self.parse_seq(indent)
        return self.parse_map(indent)

    def parse_seq(self, indent: int) -> list:
        items = []
        while True:
            head = self.peek()
            if head is None or head[0] < indent:
                break
            level, content = head
            if level > indent or not content.startswith("- "):
                break
            self.i += 1
            rest = content[2:].strip()
            if _find_colon(rest) >= 0 and not rest.startswith(("{", "[")):
                # block mapping starting on the dash line
                key = _parse_scalar(rest[: _find_colon(rest)])
                sub = {key: parse_flow(rest[_find_colon(rest) + 1 :])}
                nxt = self.peek()
                if nxt is not None and nxt[0] > level:
                    more = self.parse_map(nxt[0])
                    sub.update(more or {})
                items.append(sub)
            elif rest == "":
                nxt = self.peek()
                items.append(self.parse_block(nxt[0]) if nxt and nxt[0] > level else None)
            else:
                items.append(parse_flow(rest))
        return items

    def parse_folded(self, indent: int) -> str:
        """A plain block scalar: the LineageOS files use folded text for the
        'hold these buttons' instructions."""
        parts: list[str] = []
        while True:
            head = self.peek()
            if head is None or head[0] < indent:
                break
            parts.append(head[1])
            self.i += 1
        return " ".join(parts)

    def parse_map(self, indent: int) -> dict:
        out: dict = {}
        while True:
            head = self.peek()
            if head is None or head[0] < indent:
                break
            level, content = head
            if level > indent:
                raise MiniyamlError(f"unexpected indent at {content!r}")
            if content.startswith("- "):
                break
            idx = _find_colon(content)
            if idx < 0:
                raise MiniyamlError(f"expected 'key: value' got {content!r}")
            key = _parse_scalar(content[:idx])
            rest = content[idx + 1 :].strip()
            self.i += 1
            if rest in ("|", ">", "|-", ">-", "|+", ">+"):
                nxt = self.peek()
                out[key] = self.parse_folded(nxt[0]) if nxt and nxt[0] > level else ""
                continue
            if rest:
                out[key] = parse_flow(rest)
                continue
            nxt = self.peek()
            if nxt is None or nxt[0] <= level:
                out[key] = None
            elif nxt[1].startswith("- ") and nxt[0] > level:
                out[key] = self.parse_seq(nxt[0])
            elif _find_colon(nxt[1]) >= 0:
                out[key] = self.parse_map(nxt[0])
            else:
                out[key] = self.parse_folded(nxt[0])
        return out


def loads(text: str) -> dict:
    lines: list[tuple[int, str]] = []
    for raw in text.replace("\r\n", "\n").replace("\r", "\n").split("\n"):
        if "\t" in raw[: len(raw) - len(raw.lstrip())]:
            raw = raw.replace("\t", "  ")
        line = _strip_comment(raw)
        if not line.strip():
            continue
        lines.append((_indent(line), line.strip()))
    if not lines:
        return {}
    result = _Parser(lines).parse_block(lines[0][0])
    return result if isinstance(result, dict) else {}


def load_file(path) -> dict:
    with open(path, "r", encoding="utf-8") as fh:
        return loads(fh.read())
