#!/bin/bash

set -e

# Сборка проекта
npm run build

# Инициализация временной рабочей директории для gh-pages
git worktree add /tmp/gh-pages gh-pages || git checkout --orphan gh-pages

# Очистка старого содержимого
rm -rf /tmp/gh-pages/*

# Копирование новых файлов из dist
cp -r dist/* /tmp/gh-pages/

cd /tmp/gh-pages

# Добавление всех файлов
git add .

# Проверка, есть ли изменения для коммита
if git diff --staged --quiet; then
    echo "No changes to commit"
else
    git commit -m "deploy: обновление сайта $(date '+%Y-%m-%d %H:%M:%S')"
    git push origin gh-pages
fi

cd -
git worktree remove /tmp/gh-pages

echo "Деплой на GitHub Pages завершён!"