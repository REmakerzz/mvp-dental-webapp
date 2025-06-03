#!/bin/bash

# Создаем архив dist папки
cd dist
zip -r ../dist.zip .
cd ..

# Загружаем на Netlify Drop
echo "Загрузка на Netlify Drop..."
curl -H "Content-Type: application/zip" \
     --data-binary "@dist.zip" \
     https://app.netlify.com/drop

echo "Готово! Скопируйте URL из ответа выше." 