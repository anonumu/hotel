@echo off
chcp 65001 > nul
title Сервер ИС Гостиница (Spring Boot 8080)
echo ========================================================
echo   Запуск Spring Boot бэкенда ИС «Гостиница»...
echo   Сервер будет доступен по адресу: http://localhost:8080
echo   Для остановки нажмите Ctrl + C
echo ========================================================
cd /d "%~dp0hotel-backend"
call mvnw.cmd spring-boot:run
pause

