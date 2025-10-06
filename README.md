# tres-app

Front y back final de la tesis. 

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

O usar pm2.

## Lectura

Para leer lo que tiene la base de datos: 

```
node inspect-db.mjs
```

## Endpoints

- **/api/pdf** imprime el archivo pdf (antes /tres) 
- **/pdf** página que se despliega antes de la impresión del archivo pdf. 