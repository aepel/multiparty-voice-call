# Llamada de voz multiparte

## ¿Por qué Mediasoup?

Mediasoup es una librería que se basa en WebRTC para implementar la funcionalidad de una Unidad de Reenvío Selectiva (SFU, por sus siglas en inglés). Una SFU recibe las transmisiones de audio y video de los peers y las reenvía a todos los demás (los peers envían una y reciben muchas). Cada peer receptor puede seleccionar qué transmisiones y capas espaciales/temporales recibe. En comparación con un mezclador o MCU (Unidad de Conferencia Multipunto), este diseño ofrece un mejor rendimiento, mayor capacidad de procesamiento y menor latencia. Es altamente escalable y requiere muchos menos recursos dado que no transcodifica ni mezcla media.

Como los peers reciben media de otros peers de forma separada, pueden tener una disposición personalizada y elegir qué transmisiones renderizar y cómo mostrarlas.

Dado que estamos usando Mediasoup y puede ser un poco complicado, recomiendo sinceramente como introducción para entender qué estamos haciendo, ver este video
<https://www.youtube.com/watch?v=DOe7GkQgwPo>

### Diferentes tipos de comunicación en llamadas de video

<https://programmerclick.com/article/18041458237/>

## Arquitectura de Mediasoup

![](https://mediasoup.org/images/mediasoup-v3-architecture-01.svg)

### Entidades de Mediasoup
**Router:** es una entidad que maneja y dirige las transmisiones de medios dentro de una "sala" o "conferencia". Se puede pensar en un router como una sala de video conferencias en la que se llevan a cabo las llamadas.

Cada Router puede tener varios Transports, que son los medios por los cuales los datos de audio, video y otros datos se envían y reciben. Cada Transport puede tener múltiples Producers y Consumers, que son las fuentes y los receptores de los flujos de medios, respectivamente.

**El productor (Producer):** es una clase que representa una fuente de medios, como una webcam o un micrófono, y es responsable de enviar datos de media al servidor de mediasoup.
**El consumidor (Consumer):** es una clase que representa un receptor de media, como un elemento de video o un elemento de audio, y es responsable de recibir datos de medios del servidor de mediasoup.
**Transporte (Transport):** es un componente que maneja el envío y la recepción de los datos de media entre un cliente (usualmente un navegador) y el servidor Mediasoup. Los datos de media pueden ser de audio, video o datos arbitrarios. Hay diferentes tipos de transportes en Mediasoup para manejar diferentes protocolos y métodos de transmisión, pero todos ellos proporcionan la funcionalidad básica de transportar datos de medios.

#### Tipos de transportes
**DirectTransport:** Este transporte permite enviar/recibir RTP/RTCP a/desde Mediasoup en el mismo proceso del host. No se utiliza para comunicarse con aplicaciones externas, sino que es útil para la manipulación de medios dentro del servidor Mediasoup.

**PlainTransport:** Este transporte permite enviar y recibir RTP/RTCP/SCTP a través de UDP o TCP en direcciones y puertos arbitrarios. Es útil cuando se necesita comunicación con elementos de red que no hablan ICE o DTLS, o para implementar escenarios de retransmisión de IP.

**PipeTransport:** Similar a PlainTransport pero se puede utilizar para conectar dos Router de Mediasoup en diferentes hosts o procesos. También puede conectar diferentes Workers en el mismo host.

**WebRtcTransport:** Este transporte se utiliza para la comunicación entre el servidor Mediasoup y un cliente WebRTC, que puede ser un navegador o cualquier otra aplicación que soporte WebRTC. Admite el protocolo ICE para la negociación de la conexión y el protocolo DTLS para la encriptación.

## ¿Qué es WebRTC?

WebRTC no es solo un protocolo; es una combinación de protocolos, estándares y APIs de JavaScript que habilitan la comunicación en tiempo real que su nombre sugiere. Aprovecha las conexiones peer-to-peer del navegador para entregar datos con una latencia tan baja como 500 milisegundos o menos. Además, WebRTC es de código abierto, lo que significa que una gran comunidad de desarrolladores han contribuido y siguen contribuyendo a su desarrollo.

Es excelente para iniciar chats de video con un solo clic (probablemente esté familiarizado con varias aplicaciones que usan WebRTC cada vez que tiene una reunión o una hora feliz virtual), pero no está hecho para manejar la transmisión a grandes audiencias.

## Transmisión RTP

El Protocolo de Transporte en Tiempo Real (RTP) es un protocolo a nivel de red que transmite datos de video y audio cuando la puntualidad es esencial.

Piénsalo de esta manera: toda la tecnología de transmisión entrega datos de video y audio como "paquetes". Debido a factores como la mala conectividad a Internet, el volumen de tráfico, etc., es posible que estos paquetes lleguen al dispositivo del usuario final en el orden incorrecto, con un espaciado incorrecto entre ellos —conocido como jitter— o que no lleguen en absoluto. Algunos protocolos están diseñados para garantizar que uno o más de estos errores no ocurran, pero RTP está diseñado para acomodarse a ellos cuando ocurren.

La transmisión RTP marca los paquetes con un sello de tiempo para que lleguen en el orden correcto incluso si algunos faltan, lo que garantiza que lo que sea que esté allí llegue de inmediato. Este proceso da lugar a saltos de audio y video que (con suerte) son imperceptibles para usted o su cliente. La transmisión fluye constantemente de esta manera, facilitando el impulso de su conversación en lugar de hacerle soportar frustrantes paradas y fallos en la reproducción.

### Notas Importantes

<https://github.com/Kurento/mediasoup-demos/blob/master/mediasoup-recording/README.md#important-notes>
