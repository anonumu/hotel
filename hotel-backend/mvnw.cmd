@echo off
set "JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-11.0.30.7-hotspot"
set "PATH=%JAVA_HOME%\bin;%~dp0maven\bin;%PATH%"
"%~dp0maven\bin\mvn.cmd" %*

