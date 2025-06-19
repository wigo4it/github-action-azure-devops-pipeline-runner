#!/usr/bin/env pwsh
# Validation script for GitHub Action setup

Write-Host "🔍 Validating GitHub Action Setup..." -ForegroundColor Blue

$errors = @()
$warnings = @()

# Check required files
$requiredFiles = @(
    "action.yml",
    "package.json",
    "tsconfig.json",
    ".releaserc.json",
    ".commitlintrc.json",
    "src/main.ts",
    ".github/workflows/ci-cd.yml",
    ".github/workflows/check-pr.yml",
    ".github/workflows/manual-release.yml"
)

Write-Host "`n📁 Checking required files..." -ForegroundColor Yellow
foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        Write-Host "  ✅ $file" -ForegroundColor Green
    } else {
        Write-Host "  ❌ $file" -ForegroundColor Red
        $errors += "Missing required file: $file"
    }
}

# Check action.yml structure
Write-Host "`n🔧 Validating action.yml..." -ForegroundColor Yellow
if (Test-Path "action.yml") {
    $actionContent = Get-Content "action.yml" -Raw
    
    $checks = @(
        @{ Pattern = "using:\s*['""]?node20['""]?"; Description = "Uses Node.js 20" },
        @{ Pattern = "main:\s*['""]?dist/index\.js['""]?"; Description = "Main entry point is dist/index.js" },
        @{ Pattern = "inputs:"; Description = "Has inputs section" },
        @{ Pattern = "outputs:"; Description = "Has outputs section" }
    )
    
    foreach ($check in $checks) {
        if ($actionContent -match $check.Pattern) {
            Write-Host "  ✅ $($check.Description)" -ForegroundColor Green
        } else {
            Write-Host "  ⚠️  $($check.Description)" -ForegroundColor Yellow
            $warnings += "action.yml: $($check.Description)"
        }
    }
}

# Check package.json scripts
Write-Host "`n📦 Validating package.json scripts..." -ForegroundColor Yellow
if (Test-Path "package.json") {
    $package = Get-Content "package.json" | ConvertFrom-Json
    
    $requiredScripts = @("build", "package", "test", "lint")
    foreach ($script in $requiredScripts) {
        if ($package.scripts.$script) {
            Write-Host "  ✅ Script: $script" -ForegroundColor Green
        } else {
            Write-Host "  ❌ Script: $script" -ForegroundColor Red
            $errors += "Missing npm script: $script"
        }
    }
    
    # Check semantic-release dependencies
    $semanticDeps = @("semantic-release", "@semantic-release/changelog", "@semantic-release/git", "@semantic-release/github")
    foreach ($dep in $semanticDeps) {
        if ($package.devDependencies.$dep) {
            Write-Host "  ✅ Dependency: $dep" -ForegroundColor Green
        } else {
            Write-Host "  ⚠️  Dependency: $dep" -ForegroundColor Yellow
            $warnings += "Missing semantic-release dependency: $dep"
        }
    }
}

# Check TypeScript configuration
Write-Host "`n🔧 Validating TypeScript setup..." -ForegroundColor Yellow
if (Test-Path "tsconfig.json") {
    Write-Host "  ✅ TypeScript configuration exists" -ForegroundColor Green
} else {
    $errors += "Missing tsconfig.json"
}

# Check src directory structure
Write-Host "`n📂 Validating source structure..." -ForegroundColor Yellow
$srcFiles = @("main.ts", "auth.ts", "azure-devops.ts", "types.ts")
foreach ($file in $srcFiles) {
    $path = "src/$file"
    if (Test-Path $path) {
        Write-Host "  ✅ $path" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️  $path" -ForegroundColor Yellow
        $warnings += "Missing source file: $path"
    }
}

# Check dist directory (if exists)
Write-Host "`n📦 Checking distribution..." -ForegroundColor Yellow
if (Test-Path "dist/index.js") {
    Write-Host "  ✅ Distribution built (dist/index.js exists)" -ForegroundColor Green
} else {
    Write-Host "  ⚠️  Distribution not built (run 'npm run package')" -ForegroundColor Yellow
    $warnings += "Distribution not built - run 'npm run package'"
}

# Check workflows
Write-Host "`n🚀 Validating workflows..." -ForegroundColor Yellow
$workflows = @(
    @{ File = ".github/workflows/ci-cd.yml"; Description = "CI/CD workflow" },
    @{ File = ".github/workflows/check-pr.yml"; Description = "PR check workflow" },
    @{ File = ".github/workflows/manual-release.yml"; Description = "Manual release workflow" }
)

foreach ($workflow in $workflows) {
    if (Test-Path $workflow.File) {
        Write-Host "  ✅ $($workflow.Description)" -ForegroundColor Green
    } else {
        Write-Host "  ❌ $($workflow.Description)" -ForegroundColor Red
        $errors += "Missing workflow: $($workflow.File)"
    }
}

# Summary
Write-Host "`n📊 Validation Summary" -ForegroundColor Blue
Write-Host "===================" -ForegroundColor Blue

if ($errors.Count -eq 0 -and $warnings.Count -eq 0) {
    Write-Host "🎉 All validations passed! Your GitHub Action is properly configured." -ForegroundColor Green
} else {
    if ($errors.Count -gt 0) {
        Write-Host "`n❌ Errors ($($errors.Count)):" -ForegroundColor Red
        foreach ($error in $errors) {
            Write-Host "  • $error" -ForegroundColor Red
        }
    }
    
    if ($warnings.Count -gt 0) {
        Write-Host "`n⚠️  Warnings ($($warnings.Count)):" -ForegroundColor Yellow
        foreach ($warning in $warnings) {
            Write-Host "  • $warning" -ForegroundColor Yellow
        }
    }
}

# Next steps
Write-Host "`n🚀 Next Steps:" -ForegroundColor Blue
Write-Host "1. Run 'npm install' to install dependencies" -ForegroundColor White
Write-Host "2. Run 'npm run all' to build and package" -ForegroundColor White
Write-Host "3. Commit changes with conventional commit messages" -ForegroundColor White
Write-Host "4. Create a pull request to trigger CI/CD pipeline" -ForegroundColor White
Write-Host "5. Merge to main to create your first release!" -ForegroundColor White

Write-Host "`n📚 Documentation:" -ForegroundColor Blue
Write-Host "• See WORKFLOW.md for detailed workflow information" -ForegroundColor White
Write-Host "• Use conventional commits: feat:, fix:, docs:, etc." -ForegroundColor White
Write-Host "• Check GitHub Actions tab for workflow status" -ForegroundColor White

if ($errors.Count -gt 0) {
    exit 1
} else {
    exit 0
}
