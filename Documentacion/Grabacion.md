## FFMPEG

Un buen recurso para entender cómo funciona.
<https://github.com/leandromoreira/ffmpeg-libav-tutorial>

### SDP como entrada

SDP significa Protocolo de Descripción de Sesión. Es un formato basado en texto utilizado para describir sesiones multimedia, incluyendo los parámetros de las transmisiones de medios que se están transmitiendo. En el contexto de mediasoup, la configuración SDP contiene los detalles de las transmisiones de medios que se están transmitiendo entre el cliente y el servidor de mediasoup, incluyendo los códecs que se están utilizando, los parámetros RTP (Protocolo de Transporte en Tiempo Real), y otros detalles relacionados con la sesión.

Al grabar una transmisión de medios con ffmpeg, necesitamos proporcionar la configuración SDP como entrada para que ffmpeg sepa cómo decodificar la transmisión de medios entrante. Hacemos esto pasando la configuración SDP como una cadena a la opción -i del comando ffmpeg.

Podemos extraer la configuración SDP del objeto rtpParameters del consumidor de mediasoup, que contiene los parámetros RTP necesarios para transmitir la transmisión de medios. O podemos escribir nuestra propia configuración SDP. Pasamos esta configuración SDP como entrada a ffmpeg usando la opción -i.

SDP significa Protocolo de Descripción de Sesión. Es un formato para describir los parámetros de comunicaciones de medios en streaming. SDP se utiliza para describir las sesiones de comunicación multimedia con el propósito de anuncio de sesión, invitación a la sesión, y otras formas de inicio de sesión multimedia.

En el contexto de WebRTC y mediasoup, SDP se utiliza para describir las propiedades de una transmisión de medios, como los códecs que se están utilizando, las velocidades de bits, las direcciones IP y los puertos para los canales de datos, y más.

Por ejemplo, aquí hay un ejemplo de un SDP simple para una transmisión de audio:

```
v=0
o=- 0 0 IN IP4 127.0.0.1
s=-
c=IN IP4 127.0.0.1
t=0 0
m=audio 49170 RTP/AVP 0
a=rtpmap:0 PCMU/8000
```

Este SDP describe una sesión con una transmisión de audio. La transmisión de audio está utilizando el códec PCMU (un tipo de códec de audio utilizado en aplicaciones de telefonía) a una tasa de muestreo de 8000 Hz.

En una conexión WebRTC, el formato SDP se utiliza para comunicar los detalles de las transmisiones de medios entre los pares. El SDP es generado primero por el que llama, que lo incluye en el mensaje de oferta. Luego, el que recibe la llamada genera su propio SDP en respuesta e incluye su SDP en el mensaje de respuesta. Una vez que ambos pares han acordado los detalles de la conexión, pueden comenzar a transmitir medios.

## Kurento Media Server

Kurento es un servidor de medios utilizado para realizar grabaciones como asistencia para el protocolo RTCP.
<https://github.com/Kurento/mediasoup-demos/tree/master/mediasoup-kurento-filter/>

RTP significa Protocolo de Transporte en Tiempo Real. Es un protocolo de red para entregar audio y video a través de redes IP. RTP se utiliza ampliamente en sistemas de comunicación y entretenimiento que implican transmisión de medios, como telefonía, aplicaciones de videoconferencia, servicios de televisión y características de push-to-talk basadas en la web.

RTP se utiliza en conjunto con el Protocolo de Control RTP (RTCP). Mientras que RTP lleva las transmisiones de medios (por ejemplo, audio y video), RTCP se utiliza para monitorizar las estadísticas de transmisión e información de calidad de servicio (QoS).

Por lo tanto, una transmisión RTP se refiere a la entrega continua de datos de audio o video a través de una red utilizando el protocolo RTP. Cada transmisión RTP se identifica por un par que consiste en una dirección IP de origen y un número de puerto de origen, proporcionando así un identificador único para esa transmisión.

RTP incluye una serie de características que lo hacen adecuado para aplicaciones en tiempo real y de transmisión de medios:

Identificación del tipo de carga útil: El tipo de códec de la carga útil (por ejemplo, datos de audio o video) se identifica en la cabecera RTP.

Numeración de secuencia: Cada paquete RTP incluye un número de secuencia que se puede utilizar para detectar la pérdida de paquetes y para restaurar la secuencia de paquetes.

Estampado de tiempo: Los paquetes RTP incluyen una marca de tiempo basada en un reloj específico de los medios, permitiendo la sincronización y la gestión del jitter.

Identificación de la fuente: Los paquetes RTP incluyen un identificador de fuente de sincronización (SSRC) que identifica de forma única la fuente de la transmisión.

Es importante destacar que RTP en sí mismo no garantiza la entrega ni evita la entrega en desorden, ni asume que la red subyacente es confiable y entrega los paquetes en secuencia. Estos son aspectos que deben ser manejados por la aplicación o el protocolo de transporte (como TCP o UDP) en el que se ejecuta RTP.

## Grabación en mediasoup

Cree un proceso hijo FFmpeg para cada productor: Cuando se crea un nuevo productor en mediasoup, puede crear un nuevo proceso FFmpeg para grabar la pista del productor. Esto implicará la creación de un archivo SDP para la transmisión RTP del productor y pasarla a FFmpeg como una entrada. La pista de cada productor se grabará en un archivo separado.

Monitorear la sala de mediasoup para eventos de productores: Deberá monitorear la sala para eventos que indiquen que un productor ha sido agregado o eliminado. Cuando se agrega un productor, iniciará un nuevo proceso FFmpeg para él. Cuando se elimina un productor, deberá terminar de manera limpia el correspondiente proceso FFmpeg.

Combinar las grabaciones en la postproducción: Después de que la reunión ha terminado, puede combinar los archivos de grabación separados en un solo archivo. Esto requerirá otro proceso FFmpeg para codificar el archivo final. Es posible que desee utilizar un proceso o servicio separado para manejar esto, especialmente si necesita administrar grabaciones para múltiples salas.
