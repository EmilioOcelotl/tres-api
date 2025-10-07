# tres-app

Plataforma integral para la gestión, visualización y exportación de notas académicas desde Trilium Notes.

## Back

API general para la lectura de notas en una base de datos e impresión en formato PDF. 

### Uso

```
npm install
npm start
```

Con nodemon

```
npm run dev
```

O usar pm2:

```
pm2 start back/app.js --name "tres-app" 
```

### Lectura

Para leer lo que tiene la base de datos: 

```
node inspect-db.mjs
```

### Endpoints

- **/api/pdf** imprime el archivo pdf (antes /tres) 
- **/pdf** página que se despliega antes de la impresión del archivo pdf. 