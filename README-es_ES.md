<div align="center">
    <p>
        <h1>⬇️ Mediafire DL</h1>
    </p>
    <p>
        <a href="README.md"><img src="en_US.png" alt="English Language"/> Ingles</a> — <a href="README-es_ES.md"><img src="es_ES.png" alt="English Language"/> Español</a>
    </p>
</div>

Un programa de terminal simple pero muy útil para descargar archivos de mediafire.com (archivos y carpetas).

## 📸 Vista previa

![Preview!](preview.gif)

## ✨ Uso

```bash
Uso: mediafiredl [opciones] [links...]

Descarga archivos y carpetas de MediaFire

Argumentos:
  links                         Enlaces de archivos o carpetas de MediaFire

Optiones:
  -V, --version                 Muestra el número de versión
  -o, --output <path>           Directorio de salida (predeterminado: directorio actual) (predeterminado: "./")
  -m, --max-downloads <number>  Descargas simultáneas máximas (predeterminado: "2")
  -i, --input-file <path>       Ruta a un archivo de texto que contiene enlaces de MediaFire
  -d, --details                 Habilitar salida detallada (modo detallado) (predeterminado: false)
  --inspect                     Obtiene información detallada sobre el enlace proporcionado sin descargar el archivo. (predeterminado: false)
  --beautify                    Devuelve con un formato embellecedor los datos a mostrar para la opción 'inspect'. (predeterminado: false)
  -h, --help                    Mostrar ayuda
```

## 🔧 Instalación

Solo tienes que ir a la [página de lanzamiento](https://github.com/dapize/mediafiredl/releases) para obtener el binario correcto. Los sistemas operativos compatibles son: Linux, Windows (Intel y ARM), Mac (Intel y ARM). Es portable

```bash
## Ejemplo de una instalación en linux
wget -c https://github.com/dapize/mediafiredl/releases/download/v0.3.1/mediafiredl_linux -O mediafiredl
chmod +x ./mediafiredl
```

**¡Y listo!** Eso es todo lo que necesitas para usar **mediafiredl**.

## 📌 Ejemplos

#### Descarga por carpeta

![Preview!](folder.gif)

#### Descarga desde un archivo de texto (un enlace por línea)

![Preview!](file.gif)

#### Descarga con más detalles

![Preview!](details.gif)

## 💡 Contribuyendo

1. Haz un fork al proyecto.
2. Crea una rama para la nueva característica.
3. Escribe la nueva característica.
4. Escribe la prueba unitaria.
5. Envía una solicitud de incorporación de cambios.

## 💖 Donar

Si crees que este software es útil y te ahorra mucho trabajo, muchos costes y te permite dormir mucho mejor, entonces donar una pequeña cantidad sería genial.

<a href="https://www.buymeacoffee.com/danielpz" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/default-orange.png" alt="Cómprame un café" height="41" width="174"></a>

## 📫 Informes de errores y solicitudes de funciones

Puedes ayudar informando errores, sugiriendo funciones, revisando especificaciones de funciones o simplemente compartiendo tu opinión. Usa [GitHub Issues](https://github.com/dapize/mediafiredl/issues) para todo eso. ¡Todas las solicitudes de incorporación de cambios son bienvenidas!

## 🧾 License

El código y la documentación se publican bajo la [licencia MIT](LICENSE).
