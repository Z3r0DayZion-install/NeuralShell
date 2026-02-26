param(
  [string]$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

function Get-EnvPath { Join-Path $RepoRoot '.env' }
function Get-EnvExamplePath { Join-Path $RepoRoot '.env.example' }

function Read-EnvFile([string]$path) {
  if (!(Test-Path -LiteralPath $path)) { return @() }
  return Get-Content -LiteralPath $path -ErrorAction Stop
}

function Upsert-EnvLines([string[]]$lines, [hashtable]$kv) {
  $out = New-Object System.Collections.Generic.List[string]
  $seen = @{}

  foreach ($line in $lines) {
    $m = [regex]::Match($line, '^(?<k>[A-Z0-9_]+)=(?<v>.*)$')
    if ($m.Success) {
      $k = $m.Groups['k'].Value
      if ($kv.ContainsKey($k)) {
        $val = [string]$kv[$k]
        $out.Add("$k=$val")
        $seen[$k] = $true
        continue
      }
    }
    $out.Add($line)
  }

  $missing = @()
  foreach ($k in $kv.Keys) {
    if (-not $seen.ContainsKey($k)) {
      $missing += $k
    }
  }

  if ($missing.Count -gt 0) {
    $out.Add('')
    $out.Add('# Added by NeuralShell Key Connector')
    foreach ($k in ($missing | Sort-Object)) {
      $out.Add("$k=$([string]$kv[$k])")
    }
  }

  return ,$out.ToArray()
}

function Ensure-EnvExists {
  $envPath = Get-EnvPath
  if (Test-Path -LiteralPath $envPath) { return }
  $example = Get-EnvExamplePath
  if (!(Test-Path -LiteralPath $example)) {
    throw "Missing .env.example at $example"
  }
  Copy-Item -LiteralPath $example -Destination $envPath -Force
}

function Lock-EnvAcl {
  $envPath = Get-EnvPath
  if (!(Test-Path -LiteralPath $envPath)) { return }
  try {
    $user = "$env:USERDOMAIN\$env:USERNAME"
    & icacls $envPath /inheritance:r /grant:r "$user:(F)" | Out-Null
  } catch {
    # best-effort
  }
}

function Run-Cmd([string]$file, [string[]]$args) {
  $psi = New-Object System.Diagnostics.ProcessStartInfo
  $psi.FileName = $file
  $psi.WorkingDirectory = $RepoRoot
  $psi.RedirectStandardOutput = $true
  $psi.RedirectStandardError = $true
  $psi.UseShellExecute = $false
  $psi.CreateNoWindow = $true
  foreach ($a in $args) { [void]$psi.ArgumentList.Add($a) }

  $p = New-Object System.Diagnostics.Process
  $p.StartInfo = $psi
  [void]$p.Start()
  $stdout = $p.StandardOutput.ReadToEnd()
  $stderr = $p.StandardError.ReadToEnd()
  $p.WaitForExit()

  return [pscustomobject]@{ Code = $p.ExitCode; Out = $stdout; Err = $stderr }
}

function Mask([string]$s) {
  if ([string]::IsNullOrWhiteSpace($s)) { return '' }
  $t = $s.Trim()
  if ($t.Length -le 6) { return ('*' * $t.Length) }
  return ($t.Substring(0,3) + ('*' * ($t.Length - 6)) + $t.Substring($t.Length-3))
}

# --- UI ---
$form = New-Object System.Windows.Forms.Form
$form.Text = 'NeuralShell Key Connector'
$form.Width = 920
$form.Height = 720
$form.StartPosition = 'CenterScreen'

$topLabel = New-Object System.Windows.Forms.Label
$topLabel.AutoSize = $false
$topLabel.Width = 880
$topLabel.Height = 55
$topLabel.Left = 15
$topLabel.Top = 10
$topLabel.Text = "Paste API keys here, click Save. Keys are written to .env (gitignored).\r\nThen click Preflight/Test to verify providers."
$form.Controls.Add($topLabel)

$show = New-Object System.Windows.Forms.CheckBox
$show.Text = 'Show keys'
$show.Left = 15
$show.Top = 70
$show.Width = 120
$form.Controls.Add($show)

$openLinks = New-Object System.Windows.Forms.Button
$openLinks.Text = 'Open Links Folder'
$openLinks.Left = 150
$openLinks.Top = 66
$openLinks.Width = 150
$form.Controls.Add($openLinks)

$panel = New-Object System.Windows.Forms.Panel
$panel.Left = 15
$panel.Top = 100
$panel.Width = 880
$panel.Height = 470
$panel.AutoScroll = $true
$form.Controls.Add($panel)

$output = New-Object System.Windows.Forms.TextBox
$output.Left = 15
$output.Top = 580
$output.Width = 880
$output.Height = 90
$output.Multiline = $true
$output.ScrollBars = 'Vertical'
$output.ReadOnly = $true
$form.Controls.Add($output)

$btnLoad = New-Object System.Windows.Forms.Button
$btnLoad.Text = 'Load .env'
$btnLoad.Left = 15
$btnLoad.Top = 680
$btnLoad.Width = 120
$form.Controls.Add($btnLoad)

$btnSave = New-Object System.Windows.Forms.Button
$btnSave.Text = 'Save .env'
$btnSave.Left = 150
$btnSave.Top = 680
$btnSave.Width = 120
$form.Controls.Add($btnSave)

$btnPre = New-Object System.Windows.Forms.Button
$btnPre.Text = 'Run Preflight'
$btnPre.Left = 285
$btnPre.Top = 680
$btnPre.Width = 130
$form.Controls.Add($btnPre)

$btnTest = New-Object System.Windows.Forms.Button
$btnTest.Text = 'Run Live Test'
$btnTest.Left = 430
$btnTest.Top = 680
$btnTest.Width = 130
$form.Controls.Add($btnTest)

$btnClose = New-Object System.Windows.Forms.Button
$btnClose.Text = 'Close'
$btnClose.Left = 815
$btnClose.Top = 680
$btnClose.Width = 80
$form.Controls.Add($btnClose)

# Fields
$fields = @(
  @{ k='MISTRAL_API_KEY'; label='Mistral API Key' },
  @{ k='ANTHROPIC_API_KEY'; label='Anthropic API Key' },
  @{ k='GROQ_API_KEY'; label='Groq API Key' },
  @{ k='TOGETHER_API_KEY'; label='Together API Key' },
  @{ k='PERPLEXITY_API_KEY'; label='Perplexity API Key' },
  @{ k='COHERE_API_KEY'; label='Cohere API Key' },
  @{ k='GOOGLE_API_KEY'; label='Google (Gemini) API Key' },
  @{ k='OPENAI_API_KEY'; label='OpenAI API Key (optional)' },
  @{ k='AZURE_OPENAI_API_KEY'; label='Azure OpenAI API Key (optional)' },
  @{ k='AWS_REGION'; label='AWS Region (Bedrock optional)' },
  @{ k='AWS_ACCESS_KEY_ID'; label='AWS Access Key ID (optional)' },
  @{ k='AWS_SECRET_ACCESS_KEY'; label='AWS Secret Access Key (optional)' },
  @{ k='AWS_SESSION_TOKEN'; label='AWS Session Token (optional)' },
  @{ k='NS_SANDBOX_IMAGE'; label='Sandbox image (default node:20-alpine)' }
)

$providerChecks = @(
  @{ id='mistral'; k='MISTRAL_API_KEY'; label='mistral' },
  @{ id='anthropic'; k='ANTHROPIC_API_KEY'; label='anthropic' },
  @{ id='groq'; k='GROQ_API_KEY'; label='groq' },
  @{ id='togetherai'; k='TOGETHER_API_KEY'; label='togetherai' },
  @{ id='perplexity'; k='PERPLEXITY_API_KEY'; label='perplexity' },
  @{ id='cohere'; k='COHERE_API_KEY'; label='cohere' },
  @{ id='google'; k='GOOGLE_API_KEY'; label='google' }
)

$controls = @{}
$checkControls = @{}

$y = 10
foreach ($f in $fields) {
  $lbl = New-Object System.Windows.Forms.Label
  $lbl.Left = 10
  $lbl.Top = $y + 4
  $lbl.Width = 260
  $lbl.Text = $f.label
  $panel.Controls.Add($lbl)

  $tb = New-Object System.Windows.Forms.TextBox
  $tb.Left = 280
  $tb.Top = $y
  $tb.Width = 560

  $isSecret = $f.k -match '(_KEY|_SECRET|TOKEN)$' -and $f.k -notmatch '^NS_' -and $f.k -ne 'AWS_REGION'
  if ($isSecret) {
    $tb.UseSystemPasswordChar = $true
  }

  $panel.Controls.Add($tb)
  $controls[$f.k] = $tb

  $y += 32
}

$panelSep = New-Object System.Windows.Forms.Label
$panelSep.Left = 10
$panelSep.Top = $y + 6
$panelSep.Width = 830
$panelSep.Height = 2
$panelSep.BorderStyle = 'Fixed3D'
$panel.Controls.Add($panelSep)
$y += 16

$lblProviders = New-Object System.Windows.Forms.Label
$lblProviders.Left = 10
$lblProviders.Top = $y
$lblProviders.Width = 800
$lblProviders.Text = 'Live test providers (checked will be used for npm run llm:test):'
$panel.Controls.Add($lblProviders)
$y += 26

$x = 10
foreach ($p in $providerChecks) {
  $cb = New-Object System.Windows.Forms.CheckBox
  $cb.Left = $x
  $cb.Top = $y
  $cb.Width = 120
  $cb.Text = $p.label
  $panel.Controls.Add($cb)
  $checkControls[$p.id] = $cb
  $x += 125
}
$y += 36

function LoadFromEnv {
  try {
    Ensure-EnvExists
    $lines = Read-EnvFile (Get-EnvPath)
    $map = @{}
    foreach ($line in $lines) {
      $m = [regex]::Match($line, '^(?<k>[A-Z0-9_]+)=(?<v>.*)$')
      if ($m.Success) {
        $map[$m.Groups['k'].Value] = $m.Groups['v'].Value
      }
    }

    foreach ($k in $controls.Keys) {
      if ($map.ContainsKey($k)) {
        $controls[$k].Text = $map[$k]
      }
    }

    foreach ($p in $providerChecks) {
      $checkControls[$p.id].Checked = $map.ContainsKey($p.k) -and -not [string]::IsNullOrWhiteSpace($map[$p.k])
    }

    $output.Text = "Loaded .env from $(Get-EnvPath)";
  } catch {
    [System.Windows.Forms.MessageBox]::Show($_.Exception.Message, 'Load failed', 'OK', 'Error') | Out-Null
  }
}

function SaveToEnv {
  try {
    Ensure-EnvExists
    $kv = @{}
    foreach ($k in $controls.Keys) {
      $v = [string]$controls[$k].Text
      if ($k -eq 'NS_SANDBOX_IMAGE' -and [string]::IsNullOrWhiteSpace($v)) {
        $v = 'node:20-alpine'
      }
      if (-not [string]::IsNullOrWhiteSpace($v)) {
        $kv[$k] = $v
      }
    }

    $envPath = Get-EnvPath
    $lines = Read-EnvFile $envPath
    $newLines = Upsert-EnvLines $lines $kv
    Set-Content -LiteralPath $envPath -Value $newLines -Encoding UTF8
    Lock-EnvAcl

    $masked = @()
    foreach ($k in ($kv.Keys | Sort-Object)) {
      $masked += ("$k=" + (Mask $kv[$k]))
    }

    $output.Text = "Saved .env (masked):`r`n" + ($masked -join "`r`n")
  } catch {
    [System.Windows.Forms.MessageBox]::Show($_.Exception.Message, 'Save failed', 'OK', 'Error') | Out-Null
  }
}

$show.Add_CheckedChanged({
  $showOn = $show.Checked
  foreach ($k in $controls.Keys) {
    $tb = $controls[$k]
    $isSecret = $k -match '(_KEY|_SECRET|TOKEN)$' -and $k -notmatch '^NS_' -and $k -ne 'AWS_REGION'
    if ($isSecret) {
      $tb.UseSystemPasswordChar = -not $showOn
    }
  }
})

$openLinks.Add_Click({
  try {
    $p = Join-Path $env:USERPROFILE 'Desktop\NeuralShell_API_Key_Links'
    if (Test-Path -LiteralPath $p) {
      Start-Process explorer.exe $p | Out-Null
    } else {
      [System.Windows.Forms.MessageBox]::Show("Links folder not found: $p", 'Not found', 'OK', 'Warning') | Out-Null
    }
  } catch {
    [System.Windows.Forms.MessageBox]::Show($_.Exception.Message, 'Open failed', 'OK', 'Error') | Out-Null
  }
})

$btnLoad.Add_Click({ LoadFromEnv })
$btnSave.Add_Click({ SaveToEnv })

$btnPre.Add_Click({
  try {
    SaveToEnv
    $output.AppendText("`r`n`r`nRunning llm:preflight...`r`n")
    $r = Run-Cmd 'npm' @('run','llm:preflight')
    $output.AppendText($r.Out)
    if ($r.Code -ne 0) { $output.AppendText("`r`n" + $r.Err) }
  } catch {
    [System.Windows.Forms.MessageBox]::Show($_.Exception.Message, 'Preflight failed', 'OK', 'Error') | Out-Null
  }
})

$btnTest.Add_Click({
  try {
    SaveToEnv

    $sel = @()
    foreach ($p in $providerChecks) {
      if ($checkControls[$p.id].Checked) { $sel += $p.id }
    }

    if ($sel.Count -eq 0) {
      [System.Windows.Forms.MessageBox]::Show('Select at least one provider checkbox.', 'No providers selected', 'OK', 'Warning') | Out-Null
      return
    }

    $providers = ($sel -join ',')
    $output.AppendText("`r`n`r`nRunning llm:test providers=$providers ...`r`n")
    $r = Run-Cmd 'npm' @('run','llm:test','--','--providers', $providers)
    $output.AppendText($r.Out)
    if ($r.Code -ne 0) { $output.AppendText("`r`n" + $r.Err) }
  } catch {
    [System.Windows.Forms.MessageBox]::Show($_.Exception.Message, 'Live test failed', 'OK', 'Error') | Out-Null
  }
})

$btnClose.Add_Click({ $form.Close() })

# Initial load
LoadFromEnv

[void]$form.ShowDialog()
