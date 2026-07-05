<div style="display: flex; align-items: center; justify-content: center; gap: 10px;">
  <img src="img/logo.png" width="40" alt="Yoru Logo">
  <h1 style="margin: 0;">YoruGate</h1>
</div>

<b>Платформа для поиска и просмотра аниме, управления коллекцией и создания собственных тирлистов.</b>

</p>

---

## О проекте

**YoruGate** – это веб-приложение, которое объединяет поиск информации об аниме, персональную коллекцию избранного и удобный редактор тирлистов.

В отличие от обычных каталогов, YoruGate позволяет не только находить новые тайтлы, но и создавать собственные рейтинги, сортировать аниме по уровням, а затем экспортировать результат в виде PNG изображения или JSON-файла для дальнейшего использования или публикации.

Проект состоит из собственного REST API на FastAPI и клиентского приложения на Angular.

---

## Возможности

### <img src="https://api.iconify.design/twemoji/film-frames.svg" width="19" style="vertical-align: middle;"> Каталог аниме

- просмотр каталога;
- поиск по названию;
- подробные страницы аниме;
- информация о сезонах и эпизодах;
- просмотр популярных и новых релизов.

### <img src="https://api.iconify.design/glyphs-poly/star.svg" width="23" style="vertical-align: middle;"> Избранное

- добавление аниме в избранное;
- удаление из избранного;
- персональная коллекция пользователя.

### 🏆 Тирлисты

- создание собственных тирлистов;
- Drag & Drop сортировка карточек;
- сохранение тирлистов;
- экспорт в **PNG**;
- экспорт в **JSON**;
- последующее редактирование сохранённых тирлистов.

### <img src="https://api.iconify.design/glyphs-poly/user.svg" width="23" style="vertical-align: middle;"> Пользователь

- регистрация;
- авторизация;
- JWT-аутентификация;

---

## Используемые технологии

### Frontend

![Angular](https://img.shields.io/badge/angular-%23DD0031.svg?style=for-the-badge&logo=angular&logoColor=white)

![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)

![RxJS](https://img.shields.io/badge/rxjs-%23B7178C.svg?style=for-the-badge&logo=reactivex&logoColor=white)

### Backend

![FastAPI](https://img.shields.io/badge/FastAPI-005571.svg?style=for-the-badge&logo=fastapi)

![SQLAlchemy](https://img.shields.io/badge/sqlalchemy-%23D71F00.svg?style=for-the-badge&logo=sqlalchemy&logoColor=white)

![JWT](https://img.shields.io/badge/JWT-black?style=for-the-badge&logo=JSON%20web%20tokens)

### Database

## ![Postgres](https://img.shields.io/badge/postgres-%23316192.svg?style=for-the-badge&logo=postgresql&logoColor=white)

### Используемые API

Данные об аниме получаются при помощи библиотеки [AnimeParsers](https://github.com/YaNesyTortiK/AnimeParsers)

## Структура проекта

```
AnimeApp
│
├── anime-frontend
│   ├── public
│   └── src
│       ├── app
│       │   ├── core
│       │   ├── pages
│       │   ├── shared
│       │   ├── app.config.ts
│       │   ├── app.html
│       │   ├── app.routes.ts
│       │   ├── app.scss
│       │   ├── app.ts
│       │   └── app.config.ts
│       │
│       ├── environments
│       │   ├── environment.development.ts
│       │   └── environment.ts
│       │
│       ├── index.html
│       └── styles.scss
│
├── AnimeBackend
│   ├── requirements.txt
│   ├── config.py
│   ├── main.py
│   ├── models.py
│   ├── parser_service.py
│   ├── schemas.py
│   └── security.py
│
├── database
│   └── schema.sql
│
├── img
│
│
└── README.md
```

---

## Запуск проекта

### Клонируйте репозиторий

```bash
git clone https://github.com/kiraping1337/REPOSITORY.git
cd REPOSITORY
```

### Backend

#### 1. Создать базу данных PostgreSQL

Создайте новую базу данных, например:

```sql
CREATE DATABASE yoru;
```

#### 2. Создать структуру базы данных

Импортируйте SQL-схему проекта:

```bash
psql -U postgres -d yoru -f schema.sql
```

или выполните содержимое файла `schema.sql` через pgAdmin.

#### 3. Настроить переменные окружения

Создайте файл `.env`:

```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/yoru
SECRET_KEY=your_secret_key
```

Также при необходимости в этом файле можно прописать настройки парсеров и сервера из config.py

#### 4. Установить зависимости

```bash
pip install -r requirements.txt
```

#### 5. Запустить сервер

```bash
uvicorn main:app --reload
```

---

### Frontend

```bash
cd anime-frontend

npm install

ng serve
```

После запуска приложение будет доступно по адресу:

```
http://localhost:4200
```

---

## Скриншоты

### Главная страница

![Main Page](img/main-page.jpg)

---

### Каталог

![Catalog](img/catalog-page.jpg)

---

### Страница аниме

![Anime Detail](img/anime-detail-page.jpg)

---

### Избранное

![Favorites](img/favorites.jpg)

---

### Редактор тирлистов

![Tier List](img/tierlist-page.jpg)

---

## Лицензия

MIT
