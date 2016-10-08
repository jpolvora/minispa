@echo off
echo ;%PATH%; | find /C /I ";%PROGRAMFILES%\IIS EXPRESS;"
if not errorlevel 1 goto jump
@set path=%PATH%;"%PROGRAMFILES%\IIS EXPRESS";
:jump
set "HTTPPORT=49576"
set "PUBLIC=%~dp0%src"
if not [%1]==[] (
    set httpport=%1
)
@echo on
start cmd /c iisexpress /path:%PUBLIC% /port:%HTTPPORT% /trace:info
::pause
start http://localhost:%HTTPPORT%/