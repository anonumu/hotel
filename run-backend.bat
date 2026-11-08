@echo off
chcp 65001 > nul
echo ========================================================
echo   Grand Imperial Hotel Management System (Spring Boot)
echo   Java 21 LTS / Spring Security / H2 / PostgreSQL
echo ========================================================

if exist "C:\Users\vlads\.jdks\ms-21.0.10\bin\java.exe" (
    set "JAVA_EXE=C:\Users\vlads\.jdks\ms-21.0.10\bin\java.exe"
) else (
    set "JAVA_EXE=java"
)

echo Запуск приложения: %JAVA_EXE%
"%JAVA_EXE%" -jar hotel-backend\target\hotel-backend-1.0.0.jar
pause

