import Link from "next/link";

export default function TerminosPage() {
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
            TÉRMINOS Y CONDICIONES DE USO
          </h1>
          <p className="text-zinc-500 font-medium">
            Última actualización: {fechaHoy}
          </p>
        </header>

        <main className="space-y-12 text-zinc-700 leading-relaxed text-base md:text-lg text-justify">
          <p>
            El presente documento establece los Términos y Condiciones (en
            adelante, “los Términos”) que regulan el acceso y uso del software
            ofrecido por <strong>Komy</strong>, en adelante
            “La Plataforma”, cuyo titular es <strong>[Tu Nombre Completo]</strong>,
            con domicilio en Cagua, Estado Aragua, Venezuela. Al registrarse,
            acceder o utilizar cualquiera de los servicios proporcionados, el
            cliente o establecimiento comercial, en adelante “El Cliente”,
            declara haber leído, comprendido y aceptado plenamente estos
            Términos. En caso de no estar de acuerdo con alguna de las
            disposiciones aquí establecidas, deberá abstenerse de utilizar el
            servicio.
          </p>

          <section>
            <h2 className="text-xl font-bold text-zinc-900 mb-4 uppercase">
              1. DESCRIPCIÓN DEL SERVICIO
            </h2>
            <p>
              La Plataforma ofrece un servicio de software bajo modalidad SaaS
              (Software as a Service) que permite a establecimientos
              gastronómicos crear, administrar y publicar menús digitales
              interactivos, así como estructurar pedidos que son redirigidos
              hacia la aplicación de mensajería WhatsApp del Cliente. La
              Plataforma actúa exclusivamente como proveedor tecnológico y no
              participa en la compraventa de productos, no intermedia
              transacciones comerciales, no procesa pagos, no gestiona entregas
              ni actúa como representante del Cliente ante terceros.
            </p>
            <p className="mt-4">
              La disponibilidad del servicio depende de proveedores de
              infraestructura tecnológica (incluyendo, entre otros, Vercel y los
              servicios de alojamiento que La Plataforma utilice) y de la API de
              WhatsApp de Meta, sobre los cuales La Plataforma no tiene control
              directo.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-zinc-900 mb-4 uppercase">
              2. MODALIDAD DE PRESTACIÓN Y EXENCIÓN DE GARANTÍAS
            </h2>
            <p>
              El servicio se proporciona bajo la modalidad “tal cual” y “según
              disponibilidad”. La Plataforma no garantiza que el funcionamiento
              será ininterrumpido, libre de errores o completamente seguro. No
              se garantiza disponibilidad continua del sistema ni la ausencia de
              fallas técnicas, interrupciones por mantenimiento, problemas
              derivados de los proveedores de infraestructura tecnológica (como
              Vercel), fallas o cambios en los servicios de terceros (tales como
              la API de WhatsApp de Meta), ni interrupciones causadas por
              eventos externos fuera del control razonable de La Plataforma. El
              Cliente acepta expresamente que el uso del servicio se realiza
              bajo su propio riesgo.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-zinc-900 mb-4 uppercase">
              3. LIMITACIÓN DE RESPONSABILIDAD
            </h2>
            <p>
              En la máxima medida permitida por la legislación aplicable, en
              ningún caso La Plataforma será responsable por pérdidas de ventas,
              lucro cesante, pérdida de clientes, daños indirectos,
              incidentales, especiales o consecuenciales, ni por reclamaciones
              derivadas de fallas en pagos entre el Cliente y sus consumidores
              finales.
            </p>
            <p className="mt-4">
              La responsabilidad total acumulada de La Plataforma, cualquiera sea
              la causa de la reclamación y con independencia de la naturaleza de
              la acción legal, quedará estrictamente limitada al monto total de
              las cuotas de suscripción efectivamente pagadas por el Cliente
              durante los doce (12) meses inmediatamente anteriores al hecho que
              origine dicha reclamación. Si el Cliente tuviera menos de doce
              meses utilizando el servicio, el límite será el total acumulado
              pagado hasta la fecha del hecho. Esta limitación constituye un
              elemento esencial del acuerdo y las partes reconocen que los
              precios pactados se basan en dicha limitación.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-zinc-900 mb-4 uppercase">
              4. OBLIGACIONES Y RESPONSABILIDAD DEL CLIENTE
            </h2>
            <p>
              El Cliente es el único y exclusivo responsable de los productos
              ofrecidos, los precios publicados, la veracidad y legalidad de la
              información contenida en su menú, el cumplimiento de las
              normativas sanitarias, fiscales y comerciales aplicables, la
              calidad del servicio prestado a sus consumidores finales, la
              gestión de pagos (incluyendo la aceptación de los mismos mediante
              los mecanismos que acuerde directamente con sus clientes) y
              cualquier obligación frente a terceros. La Plataforma no asume
              responsabilidad alguna por el contenido publicado por el Cliente
              ni por las consecuencias derivadas del mismo.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-zinc-900 mb-4 uppercase">
              5. PROPIEDAD INTELECTUAL
            </h2>
            <p>
              Todo el software que compone La Plataforma, incluyendo su código
              fuente, arquitectura, diseño, estructura de base de datos,
              elementos gráficos, logotipos propios y funcionalidades, es
              propiedad exclusiva de <strong>[Tu Nombre Completo]</strong>, en
              su condición de autor y titular de los derechos de propiedad
              intelectual, y se encuentra protegido por las leyes de propiedad
              intelectual aplicables en Venezuela y tratados internacionales,
              aun en ausencia de registro formal. El uso del servicio otorga al
              Cliente únicamente una licencia limitada, no exclusiva,
              intransferible y revocable para utilizar la Plataforma mientras su
              suscripción se encuentre activa.
            </p>
            <p className="mt-4">
              El Cliente conserva la titularidad sobre las imágenes, textos,
              logotipos y demás contenido propio que cargue en el sistema, y
              mediante la carga de dichos contenidos otorga a La Plataforma una
              licencia no exclusiva, gratuita y por el tiempo de vigencia de la
              suscripción, para reproducirlos, mostrarlos y distribuirlos
              públicamente con el único fin de prestar el servicio contratado
              (por ejemplo, mostrar el menú a los usuarios finales).
            </p>
            <p className="mt-4">
              Queda estrictamente prohibida la ingeniería inversa, la
              descompilación, la copia, reproducción o modificación del
              software, así como la extracción de su código fuente, total o
              parcialmente.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-zinc-900 mb-4 uppercase">
              6. INDEMNIZACIÓN
            </h2>
            <p>
              El Cliente se obliga a indemnizar, defender y mantener indemne a
              La Plataforma, a su titular, empleados y colaboradores frente a
              cualquier reclamación, demanda, daño, pérdida o gasto (incluidos
              honorarios legales razonables) que se derive de: (a) el uso del
              servicio por parte del Cliente; (b) el contenido publicado por el
              Cliente; (c) los productos ofrecidos o vendidos por el Cliente;
              (d) el incumplimiento de cualquier normativa legal aplicable a su
              actividad comercial; o (e) la violación de estos Términos. La
              Plataforma notificará al Cliente de cualquier reclamación en un
              plazo razonable y se reserva el derecho de participar en la
              defensa legal con un abogado de su elección, asumiendo el Cliente
              los costos asociados.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-zinc-900 mb-4 uppercase">
              7. SUSCRIPCIÓN, PAGOS Y SUSPENSIÓN
            </h2>
            <p>
              El servicio se presta bajo modalidad de suscripción mensual
              prepagada. El acceso al panel de administración y la visibilidad
              pública del menú están condicionados al pago oportuno de la
              suscripción. En caso de no registrarse el pago en la fecha de
              vencimiento, el sistema podrá suspender automáticamente el acceso
              del Cliente y despublicar el menú sin necesidad de notificación
              adicional.
            </p>
            <p className="mt-4">
              No se otorgarán reembolsos ni prorrateos por períodos no
              utilizados, cancelaciones anticipadas o cierres temporales del
              establecimiento. Si el impago se extiende por más de treinta (30)
              días calendario, La Plataforma podrá eliminar definitivamente la
              cuenta y su contenido sin responsabilidad alguna.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-zinc-900 mb-4 uppercase">
              8. CANCELACIÓN DE CUENTAS
            </h2>
            <p>
              La Plataforma se reserva el derecho de suspender o cancelar
              cuentas en caso de incumplimiento de estos Términos, uso indebido
              del servicio, actividades ilícitas, intentos de vulneración de la
              seguridad, ingeniería inversa o cualquier conducta que pueda
              afectar la integridad del sistema o de terceros. En estos casos La
              Plataforma podrá proceder a la cancelación inmediata y sin
              preaviso.
            </p>
            <p className="mt-4">
              Asimismo, La Plataforma podrá cancelar el servicio por decisión
              comercial sin necesidad de expresar causa, mediante notificación
              enviada al correo electrónico registrado por el Cliente con al
              menos treinta (30) días de antelación, durante los cuales el
              servicio permanecerá activo. En tal supuesto, se reembolsará al
              Cliente la parte proporcional de la suscripción correspondiente al
              período no utilizado.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-zinc-900 mb-4 uppercase">
              9. USOS PROHIBIDOS
            </h2>
            <p>
              Queda estrictamente prohibido utilizar La Plataforma para promover
              o comercializar productos ilícitos, armas, sustancias prohibidas,
              contenido fraudulento, discriminatorio, que vulnere derechos de
              propiedad intelectual de terceros, o cualquier actividad contraria
              a la ley. También se prohíbe intentar acceder sin autorización a
              áreas restringidas del sistema, alterar el código, interferir con
              la infraestructura tecnológica, o realizar cualquier acción que
              comprometa la seguridad del servicio (ataques de denegación de
              servicio, inyección de código malicioso, etc.).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-zinc-900 mb-4 uppercase">
              10. FUERZA MAYOR
            </h2>
            <p>
              La Plataforma no será responsable por incumplimientos o retrasos
              derivados de causas de fuerza mayor, incluyendo, entre otros,
              desastres naturales, fallas masivas de internet, ataques
              cibernéticos que escapen a un control razonable, actos de
              autoridad gubernamental, conflictos laborales, interrupciones o
              caídas de los proveedores de infraestructura tecnológica (como
              Vercel, servicios de hosting o DNS), cambios sustanciales en las
              políticas y/o APIs de servicios de terceros (en particular, pero
              sin limitarse, a las API de WhatsApp de Meta), así como cualquier
              otra circunstancia fuera del control razonable de La Plataforma
              que imposibilite la prestación del servicio.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-zinc-900 mb-4 uppercase">
              11. MODIFICACIONES A LOS TÉRMINOS
            </h2>
            <p>
              La Plataforma podrá modificar en cualquier momento los presentes
              Términos y Condiciones. Las modificaciones entrarán en vigor una
              vez publicadas en el sitio web (o en la sección correspondiente
              dentro de la aplicación). La Plataforma procurará notificar los
              cambios sustanciales mediante aviso en el panel de administración
              o al correo electrónico registrado por el Cliente. El uso
              continuado del servicio después de la publicación de los cambios
              constituirá la aceptación de los mismos. Si el Cliente no
              estuviera de acuerdo con las nuevas condiciones, deberá dar de
              baja su cuenta y cesar el uso del servicio.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-zinc-900 mb-4 uppercase">
              12. PROTECCIÓN DE DATOS PERSONALES
            </h2>
            <p>
              La Plataforma únicamente recaba y almacena los datos estrictamente
              necesarios para la prestación del servicio (tales como nombre del
              establecimiento, datos de contacto, preferencias de menú e
              imágenes cargadas). Dichos datos no serán cedidos, vendidos ni
              comercializados con terceros. La Plataforma aplica medidas de
              seguridad técnicas y organizativas razonables acordes con la
              naturaleza del servicio, sin que ello implique una garantía
              absoluta frente a accesos no autorizados. Para mayor detalle sobre
              el tratamiento de la información, el Cliente puede consultar la
              Política de Privacidad disponible en{" "}
              <Link
                href="/privacidad"
                className="text-zinc-900 underline underline-offset-4 hover:text-zinc-500 transition-colors"
              >
                Política de Privacidad
              </Link>
              .
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-zinc-900 mb-4 uppercase">
              13. LEGISLACIÓN APLICABLE Y JURISDICCIÓN
            </h2>
            <p>
              Para la interpretación y ejecución del presente acuerdo, las
              partes se someten a las leyes de la República Bolivariana de
              Venezuela y a la jurisdicción de los tribunales competentes de
              Cagua, Estado Aragua, renunciando expresamente a cualquier otro
              fuero que pudiera corresponderles.
            </p>
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
