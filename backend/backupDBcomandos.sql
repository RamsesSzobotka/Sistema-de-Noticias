CREATE TABLE categorias (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50)
);

CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(25),
    apellido VARCHAR(25),
    usuario VARCHAR(50) UNIQUE,
    contrasena VARCHAR(255),
    rol VARCHAR(25),
    activo BOOLEAN DEFAULT true,
    create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE noticias (
    id SERIAL PRIMARY KEY,
    titulo VARCHAR(250),
    contenido TEXT,
    activo BOOLEAN DEFAULT true,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    categoria_id INTEGER,
    usuario_id INTEGER,
    autor VARCHAR(100),
    CONSTRAINT fk_noticias_categoria
        FOREIGN KEY (categoria_id)
        REFERENCES categorias(id)
        ON DELETE SET NULL,
    CONSTRAINT fk_noticias_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id)
        ON DELETE SET NULL
);

CREATE TABLE imagenes (
    id SERIAL PRIMARY KEY,
    noticia_id INTEGER,
    imagen VARCHAR(255),
    tipo_imagen VARCHAR(255),
    CONSTRAINT fk_imagenes_noticia
        FOREIGN KEY (noticia_id)
        REFERENCES noticias(id)
        ON DELETE SET NULL
);

CREATE TABLE comentarios (
    id SERIAL PRIMARY KEY,
    noticia_id INTEGER NOT NULL,
    usuario_id INTEGER NOT NULL,
    contenido TEXT NOT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    comentario_padre_id INTEGER,
    CONSTRAINT fk_comentarios_noticia
        FOREIGN KEY (noticia_id)
        REFERENCES noticias(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_comentarios_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_comentarios_padre
        FOREIGN KEY (comentario_padre_id)
        REFERENCES comentarios(id)
        ON DELETE CASCADE
);

CREATE TABLE likes (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL,
    noticia_id INTEGER NOT NULL,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_like UNIQUE (usuario_id, noticia_id),
    CONSTRAINT fk_likes_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_likes_noticia
        FOREIGN KEY (noticia_id)
        REFERENCES noticias(id)
        ON DELETE CASCADE
);

CREATE TABLE visitas (
    id SERIAL PRIMARY KEY,
    cantidad INTEGER DEFAULT 0
);
