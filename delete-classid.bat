@echo off
echo Deleting [classId] folders...

REM Delete the specific [classId] folders
rmdir /s /q "src\app\api\classes\[classId]"
rmdir /s /q "src\app\dashboard\(student-routes)\class\[classId]"
rmdir /s /q "src\app\dashboard\student\class\[classId]"
rmdir /s /q "src\app\teacher\classes\[classId]"

echo Deletion complete.
