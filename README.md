# Multi party video voice call POC

**Esto es una prueba de concepto**

Este proyecto implementa un servidor Mediasoup utilizando Node.js para facilitar las llamadas de voz y video en multiusuario.

## Back-end

El mismo esta dividido por un back-end con las siguientes tecnologias:

- Node v16
- Socket.io
- Mediasoup v3
- FFMPEG

El mismo esta en la carpeta ``/Backend``

## Pre-requisitos

Asegúrate de tener instalado Node.js (versión 14 o superior) en tu sistema.

## Instalación

Para instalar el proyecto, sigue estos pasos:

1. Clona el repositorio en tu local.
2. Ingresa a la subcarperta ``Backend``
3. Instala las dependencias (Tarda aproximadamente 5 minutos):

```bash
yarn install
```

4. ejecuta ``yarn start```

El servidor ahora debería estar ejecutándose en `http://localhost:3016` (o el puerto que hayas especificado).

## Front-end

El mismo esta en la carpeta ``/Frontend`` y tiene el siguiente stack:

- React
- Mediasoup Client
- Socket.io client

### Para ejecutarlo

1. Ingresa a la subcarperta ``Backend``
2. Instala las dependencias (Tarda aproximadamente 5 minutos):

```bash
yarn install
```

3. ejecuta ``yarn start```

el front deberia estar corriendo en <https://localhost:3033/>

**Importante:** Los servicios de multimedia para un explorador tienen que si o si correr bajo HTTPS. Es por eso que los certificados generados son Mocks y para su utilizacion deberian ser reemplazados.

## Generar un room de video conferencia

El front tiene configurado que en funcion de la url va a pedir la generacion o conexion a un room.
Para conectarse escribir <https://localhost:3033/connect/{roomName}/{userName}>
Ejemplo: <https://localhost:3033/connect/Yoizen/Ariel1>

TODO List (Pendientes):

- Mejorar look and feel recordar que la idea de esto es que sea una POC (Proof of concept).
- Incorporar seguridad. Hoy el servidor esta totalmente abierto.
- Definir correctamente CORS (Hoy no tiene ninguna restriccion).
