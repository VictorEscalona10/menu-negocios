import Link from "next/link";

export default function PrivacidadPage() {
  const fechaHoy = new Date().toLocaleDateString("es-ES", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="min-h-screen bg-[#fafafa] text-zinc-900 py-16 px-4 md:px-8 font-sans">
      <div className="max-w-3xl mx-auto">
        <header className="mb-12 border-b border-zinc-200 pb-8">
          <Link
            href="/"
            className="text-zinc-500 hover:text-zinc-900 flex items-center gap-2 mb-8 transition-colors text-sm font-medium group"
          >
            <span className="transition-transform group-hover:-translate-x-1">
              ←
            </span>{" "}
            Volver al inicio
          </Link>
          <h1 className="text-4xl font-extrabold tracking-tight mb-4 text-zinc-900 uppercase">
            POLÍTICA DE PRIVACIDAD
          </h1>
          <p className="text-zinc-500 font-medium">
            Última actualización: {fechaHoy}
          </p>
        </header>

        <main className="space-y-12 text-zinc-700 leading-relaxed text-base md:text-lg text-justify">
          <p>
            Esta Política de Privacidad describe cómo{" "}
            <strong>Komy</strong> ("La Plataforma",
            "nosotros", "nuestro"), cuyo titular es{" "}
            <strong>[Tu Nombre Completo]</strong>, con domicilio en Cagua, Estado
            Aragua, Venezuela, recopila, utiliza, almacena y protege la
            información personal de los establecimientos comerciales que
            utilizan el servicio ("El Cliente", "usted", "su"). Al registrarse
            o utilizar La Plataforma, usted acepta las prácticas descritas en
            esta política.
          </p>

          <section>
            <h2 className="text-xl font-bold text-zinc-900 mb-4 uppercase">
              1. ¿Qué información recopilamos?
            </h2>
            <p>
              Recopilamos únicamente los datos necesarios para prestar el
              servicio de creación y publicación de menús digitales con
              redirección a WhatsApp. En concreto:
            </p>
            <ul className="list-disc pl-6 mt-4 space-y-2 text-zinc-600">
              <li>
                <strong>Datos de registro y cuenta:</strong> nombre del
                establecimiento, dirección de correo electrónico, número de
                teléfono de contacto (opcional), y cualquier otro dato
                identificativo que usted decida proporcionar al crear su cuenta.
              </li>
              <li>
                <strong>Contenido del menú:</strong> toda la información que
                usted introduzca en el sistema, incluyendo nombres de
                productos, descripciones, precios, categorías e imágenes. Las
                imágenes cargadas se almacenan para ser mostradas en su menú
                público.
              </li>
              <li>
                <strong>Datos de uso y acceso:</strong> información técnica
                recogida automáticamente, como la dirección IP, tipo de
                navegador, páginas visitadas y fecha/hora de acceso, con fines
                de diagnóstico y seguridad. Esta información no se asocia a su
                identidad de forma permanente.
              </li>
            </ul>
            <p className="mt-4">
              No recopilamos información de los consumidores finales que
              visualizan el menú, ya que la interacción de pedido se realiza
              directamente a través de la aplicación WhatsApp del Cliente, sin
              que La Plataforma intermedie ni registre esos mensajes.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-zinc-900 mb-4 uppercase">
              2. ¿Para qué utilizamos su información?
            </h2>
            <p>Utilizamos los datos exclusivamente para:</p>
            <ul className="list-disc pl-6 mt-4 space-y-2 text-zinc-600">
              <li>Crear, mantener y administrar su cuenta.</li>
              <li>Almacenar y mostrar el menú digital que usted configura.</li>
              <li>
                Proporcionar la funcionalidad de redirección de pedidos a su
                número de WhatsApp.
              </li>
              <li>
                Comunicarnos con usted sobre el servicio (facturación, cambios
                en los términos, soporte técnico).
              </li>
              <li>
                Mejorar la seguridad, la estabilidad y el funcionamiento de La
                Plataforma.
              </li>
              <li>Cumplir con las obligaciones legales aplicables.</li>
            </ul>
            <p className="mt-4">
              No utilizamos su información para fines de marketing ajeno, ni
              elaboramos perfiles automatizados, ni tomamos decisiones basadas
              únicamente en el tratamiento automatizado de sus datos.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-zinc-900 mb-4 uppercase">
              3. ¿Compartimos su información con terceros?
            </h2>
            <ul className="space-y-4 text-zinc-600">
              <li>
                <strong>Proveedores de infraestructura tecnológica:</strong> la
                Plataforma está desplegada en servicios como Vercel y otros
                servicios de alojamiento en la nube. Ellos procesan los datos
                técnicos (como la IP) para permitir el acceso al sitio, bajo
                sus propias políticas de seguridad y privacidad.
              </li>
              <li>
                <strong>API de WhatsApp (Meta):</strong> para generar el enlace
                de redirección, utilizamos el número de teléfono WhatsApp que
                usted proporcione. Este número se envía en la URL pública de
                WhatsApp, pero los mensajes entre usted y sus clientes circulan
                exclusivamente por los servidores de Meta, conforme a la
                política de privacidad de WhatsApp/Meta. La Plataforma no tiene
                acceso al contenido de esas conversaciones.
              </li>
              <li>
                <strong>Obligación legal:</strong> podemos compartir información
                si una autoridad judicial o administrativa competente lo
                requiere, siempre que se cumplan los procedimientos legales
                correspondientes.
              </li>
            </ul>
            <p className="mt-4 text-zinc-700">
              No vendemos, alquilamos, ni intercambiamos sus datos personales
              con terceros para fines comerciales o de marketing.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-zinc-900 mb-4 uppercase">
              4. Almacenamiento y seguridad
            </h2>
            <p>
              La información se almacena en servidores seguros gestionados por
              nuestro proveedor de infraestructura (Vercel y las bases de datos
              asociadas). Aplicamos medidas de seguridad técnicas y
              organizativas razonables para proteger sus datos contra accesos
              no autorizados, pérdida o alteración. Sin embargo, ningún sistema
              es 100% seguro; no podemos garantizar una protección absoluta.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-zinc-900 mb-4 uppercase">
              5. Conservación de los datos
            </h2>
            <p>
              Conservamos los datos de su cuenta mientras su suscripción se
              encuentre activa. Si su cuenta se cancela o expira por impago
              durante más de treinta (30) días, podremos eliminar de forma
              definitiva toda su información, incluyendo los menús, imágenes y
              datos asociados, sin responsabilidad alguna.
            </p>
            <p className="mt-4">
              Usted puede solicitar en cualquier momento la eliminación
              anticipada de sus datos mediante solicitud a nuestro correo de
              contacto. Atenderemos su petición en un plazo razonable, siempre
              que no exista una obligación legal de conservación.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-zinc-900 mb-4 uppercase">
              6. Sus derechos
            </h2>
            <p>
              Aunque Venezuela no cuenta con una ley integral de protección de
              datos, usted tiene derecho a:
            </p>
            <ul className="list-disc pl-6 mt-4 space-y-2 text-zinc-600">
              <li>
                Acceder a los datos personales que tenemos almacenados sobre su
                cuenta.
              </li>
              <li>Rectificarlos si son inexactos o están desactualizados.</li>
              <li>
                Cancelarlos (suprimirlos) cuando ya no sean necesarios para los
                fines para los que fueron recogidos, o usted retire su
                consentimiento.
              </li>
              <li>
                Oponerse al tratamiento de sus datos, en cuyo caso procederemos
                a la cancelación de la cuenta y eliminación de la información.
              </li>
            </ul>
            <p className="mt-4">
              Puede ejercer estos derechos enviando un mensaje a nuestro correo
              electrónico de contacto:{" "}
              <strong>[correo electrónico de soporte]</strong>. Verificaremos
              su identidad antes de procesar la solicitud.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-zinc-900 mb-4 uppercase">
              7. Datos de menores
            </h2>
            <p>
              La Plataforma no está dirigida a menores de edad ni recopila
              deliberadamente información de personas menores de 18 años. Si
              tenemos conocimiento de que hemos almacenado datos de un menor
              sin el consentimiento de su representante legal, los eliminaremos
              de inmediato.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-zinc-900 mb-4 uppercase">
              8. Cambios a esta Política de Privacidad
            </h2>
            <p>
              Podemos modificar esta política en cualquier momento. Los cambios
              entrarán en vigor una vez publicados en nuestro sitio web. Le
              notificaremos los cambios significativos mediante un aviso en el
              panel de administración o al correo electrónico registrado. El
              uso continuado del servicio después de la actualización implica
              la aceptación de la nueva política.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-zinc-900 mb-4 uppercase">
              9. Contacto
            </h2>
            <p>
              Para cualquier pregunta, solicitud o reclamo sobre esta Política
              de Privacidad, puede contactarnos en:
            </p>
            <ul className="mt-4 space-y-1 text-zinc-600">
              <li>
                <strong>Correo electrónico:</strong> [correo de contacto]
              </li>
              <li>
                <strong>Domicilio:</strong> Cagua, Estado Aragua, Venezuela.
              </li>
            </ul>
          </section>
        </main>

        <footer className="mt-20 pt-8 border-t border-zinc-200 text-center">
          <p className="text-zinc-400 text-sm">
            © {new Date().getFullYear()} Komy. Todos los
            derechos reservados.
          </p>
        </footer>
      </div>
    </div>
  );
}
