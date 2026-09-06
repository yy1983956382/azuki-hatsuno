$NoOpen = $args -contains "-NoOpen"
$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$rootFull = [System.IO.Path]::GetFullPath($root).TrimEnd("\") + "\"
$port = 8787
$bindAddress = "127.0.0.1"
$portArgIndex = [Array]::IndexOf($args, "-Port")
$bindArgIndex = [Array]::IndexOf($args, "-BindAddress")

if ($portArgIndex -ge 0 -and $args.Count -gt ($portArgIndex + 1)) {
  $port = [int]$args[$portArgIndex + 1]
}

if ($bindArgIndex -ge 0 -and $args.Count -gt ($bindArgIndex + 1)) {
  $bindAddress = [string]$args[$bindArgIndex + 1]
}

$browseHost = if ($bindAddress -eq "0.0.0.0") { "127.0.0.1" } else { $bindAddress }
$prefix = "http://$browseHost`:$port/"

function Get-LocalIPv4Addresses {
  try {
    return [System.Net.Dns]::GetHostEntry([System.Net.Dns]::GetHostName()).AddressList |
      Where-Object {
        $_.AddressFamily -eq [System.Net.Sockets.AddressFamily]::InterNetwork -and
        -not $_.ToString().StartsWith("127.")
      } |
      ForEach-Object { $_.ToString() }
  } catch {
    return @()
  }
}

function Send-Response($stream, $statusCode, $contentType, $bytes) {
  $reason = switch ($statusCode) {
    200 { "OK" }
    400 { "Bad Request" }
    403 { "Forbidden" }
    404 { "Not Found" }
    500 { "Internal Server Error" }
    default { "OK" }
  }
  $headers = @(
    "HTTP/1.1 $statusCode $reason",
    "Content-Type: $contentType",
    "Content-Length: $($bytes.Length)",
    "Cache-Control: no-store",
    "Connection: close",
    "",
    ""
  ) -join "`r`n"

  $headerBytes = [System.Text.Encoding]::ASCII.GetBytes($headers)
  $stream.Write($headerBytes, 0, $headerBytes.Length)

  if ($bytes.Length -gt 0) {
    $stream.Write($bytes, 0, $bytes.Length)
  }
}

function Send-TextResponse($stream, $statusCode, $message) {
  $bytes = [System.Text.Encoding]::UTF8.GetBytes($message)
  Send-Response $stream $statusCode "text/plain; charset=utf-8" $bytes
}

function Get-ContentType($path) {
  switch ([System.IO.Path]::GetExtension($path).ToLowerInvariant()) {
    ".html" { "text/html; charset=utf-8"; break }
    ".css" { "text/css; charset=utf-8"; break }
    ".js" { "application/javascript; charset=utf-8"; break }
    ".txt" { "text/plain; charset=utf-8"; break }
    ".jpg" { "image/jpeg"; break }
    ".jpeg" { "image/jpeg"; break }
    ".png" { "image/png"; break }
    ".webp" { "image/webp"; break }
    ".gif" { "image/gif"; break }
    default { "application/octet-stream" }
  }
}

$listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Parse($bindAddress), $port)

try {
  $listener.Start()
} catch {
  Write-Host "Could not start the local site server on $prefix"
  Write-Host "Close any process using port $port, then try again."
  Write-Host $_.Exception.Message
  Read-Host "Press Enter to close"
  exit 1
}

if (-not $NoOpen) {
  Start-Process ($prefix + "index.html")
}

Write-Host "Local site running at $prefix"
if ($bindAddress -eq "0.0.0.0") {
  foreach ($ip in (Get-LocalIPv4Addresses)) {
    Write-Host "Network URL: http://$ip`:$port/index.html"
  }
}
Write-Host "Keep this window open while editing note.txt."
Write-Host "Press Ctrl+C to stop."

try {
  while ($true) {
    $client = $listener.AcceptTcpClient()
    $reader = $null
    $stream = $null

    try {
      $stream = $client.GetStream()
      $reader = [System.IO.StreamReader]::new($stream, [System.Text.Encoding]::ASCII, $false, 1024, $true)
      $requestLine = $reader.ReadLine()

      if ([string]::IsNullOrWhiteSpace($requestLine)) {
        Send-TextResponse $stream 400 "Bad request"
        continue
      }

      $parts = $requestLine -split "\s+"
      if ($parts.Count -lt 2 -or $parts[0] -ne "GET") {
        Send-TextResponse $stream 404 "Not found"
        continue
      }

      while ($true) {
        $headerLine = $reader.ReadLine()
        if ([string]::IsNullOrEmpty($headerLine)) {
          break
        }
      }

      $requestPath = ($parts[1] -split "\?", 2)[0]
      $relativePath = [System.Uri]::UnescapeDataString($requestPath.TrimStart("/"))

      if ([string]::IsNullOrWhiteSpace($relativePath)) {
        $relativePath = "index.html"
      }

      $relativePath = $relativePath -replace "/", [System.IO.Path]::DirectorySeparatorChar
      $filePath = [System.IO.Path]::GetFullPath((Join-Path $root $relativePath))

      if (-not $filePath.StartsWith($rootFull, [System.StringComparison]::OrdinalIgnoreCase)) {
        Send-TextResponse $stream 403 "Forbidden"
        continue
      }

      if (-not (Test-Path -LiteralPath $filePath -PathType Leaf)) {
        Send-TextResponse $stream 404 "Not found"
        continue
      }

      $bytes = [System.IO.File]::ReadAllBytes($filePath)
      Send-Response $stream 200 (Get-ContentType $filePath) $bytes
    } catch {
      try {
        Send-TextResponse $stream 500 "Server error"
      } catch {
      }
    } finally {
      if ($reader) {
        $reader.Dispose()
      }
      if ($stream) {
        $stream.Dispose()
      }
      $client.Close()
    }
  }
} finally {
  $listener.Stop()
}
