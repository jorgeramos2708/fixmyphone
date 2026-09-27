# Recorre las pantallas del .exe por accesibilidad y vuelca lo que ve la gente.
#
# UIAutomation es la unica via que funciona con Electron: el modelo no ve las
# capturas, y el DOM no existe fuera de un navegador.
#
# Lo que costaron tiempo, escrito para no volver a perderlo:
#
#   1. Hay que ACTIVAR la ventana antes de leerla. Sin enfocar, Chromium no
#      construye el arbol y no hay nada que leer.
#   2. Hay que buscar con TreeScope.Descendants. La ventana cuelga de varios
#      Panes vacios; el contenido real esta dentro del nodo {RootWebArea} de
#      tipo Document.
#   3. Hay que pedirle los DESCENDIENTES a ese Document. Recorrer con Children
#      desde la ventana devuelve el Document y se detiene: el arbol de Chromium
#      cuelga del Document, no de la ventana.
#   4. Los NOMBRES no se pueden comparar tal cual. La consola de Windows los
#      pasa por cp1252, asi que "Diagnostico" con tilde llega como "Diagn?stico"
#      y cualquier comparacion exacta falla. Se comparan sin diacriticos.
#   5. `Invoke` a veces falla con "Error no reconocido" en botones de Chromium.
#      Se recurre a un clic de raton en el punto del elemento, que es lo que
#      hace una persona de todos modos.
param(
  [string]$Salida = "$env:TEMP\fmp-pantallas.txt"
)

Add-Type -AssemblyName UIAutomationClient
Add-Type -AssemblyName UIAutomationTypes

Add-Type @"
using System;
using System.Runtime.InteropServices;
public class Win {
  [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr h);
  [DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr h, int c);
  [DllImport("user32.dll")] public static extern bool BringWindowToTop(IntPtr h);
  [DllImport("user32.dll")] public static extern bool SetCursorPos(int x, int y);
  [DllImport("user32.dll")] public static extern void mouse_event(uint f, uint x, uint y, uint d, IntPtr e);
  public const uint IZQ = 0x0002, IZQ_SUELTO = 0x0004;
  public static void Clic(int x, int y) {
    SetCursorPos(x, y);
    System.Threading.Thread.Sleep(120);
    mouse_event(IZQ, 0, 0, 0, IntPtr.Zero);
    System.Threading.Thread.Sleep(60);
    mouse_event(IZQ_SUELTO, 0, 0, 0, IntPtr.Zero);
  }
}
"@

# Sin diacriticos y en minuscula, para comparar nombres que llegan con la
# tilde rota por la consola de Windows.
function Normalizar($s) {
  $t = $s -replace "[^A-Za-z0-9 ]", " "
  $t = $t -replace "\s+", " "
  return $t.Trim().ToLowerInvariant()
}

function Get-Ventana {
  $p = Get-Process -Name "FixMyPhone" -ErrorAction SilentlyContinue |
    Where-Object { $_.MainWindowTitle } | Select-Object -First 1
  if (-not $p) { return $null }
  [void][Win]::ShowWindow($p.MainWindowHandle, 9)
  [void][Win]::BringWindowToTop($p.MainWindowHandle)
  [void][Win]::SetForegroundWindow($p.MainWindowHandle)
  Start-Sleep -Milliseconds 1200
  return [System.Windows.Automation.AutomationElement]::FromHandle($p.MainWindowHandle)
}

function Get-Document($ventana) {
  return $ventana.FindFirst(
    [System.Windows.Automation.TreeScope]::Descendants,
    (New-Object System.Windows.Automation.PropertyCondition(
      [System.Windows.Automation.AutomationElement]::AutomationIdProperty,
      "RootWebArea"
    ))
  )
}

function Get-Nodos($doc) {
  return $doc.FindAll(
    [System.Windows.Automation.TreeScope]::Descendants,
    [System.Windows.Automation.Condition]::TrueCondition
  )
}

function Volcar($doc, $etiqueta) {
  $lineas = @()
  $lineas += ""
  $lineas += "################ $etiqueta ################"
  $todos = Get-Nodos $doc
  $lineas += "  ($($todos.Count) nodos)"
  for ($i = 0; $i -lt $todos.Count; $i++) {
    $c = $todos[$i].Current
    $tipo = $c.ControlType.ProgrammaticName -replace "ControlType\.", ""
    $txt = $c.Name
    if (-not $txt) { continue }
    $txt = $txt -replace "\s+", " "
    if ($txt.Length -gt 170) { $txt = $txt.Substring(0, 170) + "..." }
    $marca = "[$tipo]"
    if ($tipo -eq "Button" -and -not $c.IsEnabled) { $marca += " [INHABILITADO]" }
    $marca += " $txt"
    $lineas += "  $marca"
  }
  return , $lineas
}

function IrA($doc, $nombrePantalla) {
  $queda = Normalizar $nombrePantalla
  $nodos = Get-Nodos $doc
  for ($i = 0; $i -lt $nodos.Count; $i++) {
    $c = $nodos[$i].Current
    if ($c.ControlType -ne [System.Windows.Automation.ControlType]::Button) { continue }
    if (-not (Normalizar $c.Name).StartsWith($queda)) { continue }

    # Un boton inhabilitado se parece a uno que no respondio, y la diferencia
    # importa: "no se llego a la pantalla" suena a bug, cuando a veces es que
    # la pantalla todavia no existe. Se dice cual de las dos es.
    if (-not $c.IsEnabled) {
      Write-Host "  la pantalla $nombrePantalla esta INHABILITADA (prevista, no rota)"
      return $false
    }

    try {
      $p = $c.GetCurrentPattern([System.Windows.Automation.SelectionItemPattern]::Pattern)
      if ($p) { $p.Select(); Start-Sleep -Seconds 2; return $true }
    } catch { }
    try {
      $c.GetCurrentPattern([System.Windows.Automation.InvokePattern]::Pattern).Invoke()
      Start-Sleep -Seconds 2
      return $true
    } catch { }
    # Ultimo recurso: un clic de verdad, en el punto que el elemento declara.
    try {
      $r = $c.BoundingRectangle
      [Win]::Clic([int]($r.X + $r.Width / 2), [int]($r.Y + $r.Height / 2))
      Start-Sleep -Seconds 2
      return $true
    } catch { }
  }
  Write-Host "  no hay ningun boton que se llame $nombrePantalla"
  return $false
}

$todo = @()
$todo += "Volcado por accesibilidad de la ventana de FixMyPhone"
$todo += "Generado: " + (Get-Date -Format "yyyy-MM-dd HH:mm:ss")

$ventana = Get-Ventana
if (-not $ventana) { Write-Error "no hay ventana de FixMyPhone"; exit 1 }
$doc = Get-Document $ventana
if (-not $doc) { Write-Error "no hay arbol (falta --force-renderer-accessibility)"; exit 1 }

$todo += Volcar $doc "Equipo"

foreach ($pantalla in @("Diagn", "Informe", "Licencia", "Historial")) {
  $antes = Get-Ventana
  $antesDoc = Get-Document $antes
  if (IrA $antesDoc $pantalla) {
    $doc = Get-Document (Get-Ventana)
    $todo += Volcar $doc $pantalla
  }
}

[IO.File]::WriteAllLines($Salida, $todo, (New-Object Text.UTF8Encoding($false)))
Write-Output "lineas: $($todo.Count) -> $Salida"
