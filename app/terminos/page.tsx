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

        <main className="space-y-8 text-zinc-700 leading-relaxed text-base md:text-lg text-justify">
          <p>
            El presente documento establece los Términos y Condiciones que
            regulan el acceso y uso del software ofrecido por{" "}
            <strong>[Nombre de la Plataforma]</strong>, en adelante “La
            Plataforma”. Al registrarse, acceder o utilizar cualquiera de los
            servicios proporcionados, el cliente o establecimiento comercial, en
            adelante “El Cliente”, declara haber leído, comprendido y aceptado
            plenamente estos términos. En caso de no estar de acuerdo con alguna
            de las disposiciones aquí establecidas, deberá abstenerse de
            utilizar el servicio.
          </p>

          <p>
            La Plataforma ofrece un servicio de software bajo modalidad SaaS que
            permite a establecimientos gastronómicos crear, administrar y
            publicar menús digitales interactivos, así como estructurar pedidos
            que son redirigidos hacia la aplicación de mensajería WhatsApp del
            Cliente. La Plataforma actúa exclusivamente como proveedor
            tecnológico y no participa en la compraventa de productos, no
            intermedia transacciones comerciales, no procesa pagos, no gestiona
            entregas ni actúa como representante del Cliente ante terceros.
          </p>

          <p>
            El servicio se proporciona bajo la modalidad “tal cual” y “según
            disponibilidad”. La Plataforma no garantiza que el funcionamiento
            será ininterrumpido, libre de errores o completamente seguro. No se
            garantiza disponibilidad continua del sistema ni la ausencia de
            fallas técnicas, interrupciones por mantenimiento, problemas
            derivados de proveedores de infraestructura tecnológica, fallas en
            servicios de terceros como WhatsApp, ni interrupciones causadas por
            eventos externos fuera del control razonable de La Plataforma. El
            Cliente acepta que el uso del servicio se realiza bajo su propio
            riesgo.
          </p>

          <p>
            En ningún caso La Plataforma será responsable por pérdidas de
            ventas, lucro cesante, pérdida de clientes, daños indirectos,
            incidentales, especiales o consecuenciales, ni por reclamaciones
            derivadas de fallas en pagos entre el Cliente y sus consumidores
            finales. La responsabilidad total acumulada de La Plataforma,
            cualquiera sea la causa de la reclamación, se limitará estrictamente
            al monto efectivamente pagado por el Cliente durante los treinta
            días anteriores al hecho que origine dicha reclamación. Esta
            limitación aplica independientemente de la naturaleza de la acción
            legal.
          </p>

          <p>
            El Cliente es el único y exclusivo responsable de los productos
            ofrecidos, los precios publicados, la información contenida en su
            menú, el cumplimiento de las normativas sanitarias, fiscales y
            comerciales aplicables, la calidad del servicio prestado a sus
            consumidores, la gestión de pagos y cualquier obligación frente a
            terceros. La Plataforma no asume responsabilidad alguna por el
            contenido publicado por el Cliente ni por las consecuencias
            derivadas del mismo.
          </p>

          <p>
            Todo el software, incluyendo su código fuente, arquitectura, diseño,
            estructura de base de datos, elementos gráficos, logotipos y
            funcionalidades, es propiedad exclusiva de{" "}
            <strong>[Nombre de tu Empresa o Tu Nombre]</strong>, y se encuentra
            protegido por las leyes de propiedad intelectual aplicables. El uso
            del servicio otorga al Cliente únicamente una licencia limitada, no
            exclusiva, intransferible y revocable para utilizar la Plataforma
            mientras su suscripción se encuentre activa. El Cliente conserva la
            titularidad sobre las imágenes, textos, logotipos y demás contenido
            propio que cargue en el sistema.
          </p>

          <p>
            El Cliente se obliga a indemnizar, defender y mantener indemne a La
            Plataforma, sus propietarios, empleados y colaboradores frente a
            cualquier reclamación, demanda, daño, pérdida o gasto, incluidos
            honorarios legales, que se derive del uso del servicio, del
            contenido publicado por el Cliente, de los productos ofrecidos, o
            del incumplimiento de cualquier disposición legal aplicable a su
            actividad comercial.
          </p>

          <p>
            El servicio se presta bajo modalidad de suscripción mensual
            prepagada. El acceso al panel de administración y la visibilidad
            pública del menú están condicionados al pago oportuno. En caso de no
            registrarse el pago en la fecha correspondiente, el sistema podrá
            suspender automáticamente el acceso del Cliente y despublicar el
            menú sin necesidad de notificación adicional. No se otorgarán
            reembolsos ni prorrateos por períodos no utilizados, cancelaciones
            anticipadas o cierres temporales del establecimiento. Si el impago
            se extiende por más de treinta días, La Plataforma podrá eliminar
            definitivamente la cuenta y su contenido sin responsabilidad alguna.
          </p>

          <p>
            La Plataforma se reserva el derecho de suspender o cancelar cuentas
            en caso de incumplimiento de estos términos, uso indebido del
            servicio, actividades ilícitas, intentos de vulneración de la
            seguridad, ingeniería inversa o cualquier conducta que pueda afectar
            la integridad del sistema o de terceros. Asimismo, podrá cancelar el
            servicio por decisión comercial, previa notificación razonable
            cuando sea posible.
          </p>

          <p>
            Queda estrictamente prohibido utilizar la Plataforma para promover o
            comercializar productos ilícitos, armas, sustancias prohibidas,
            contenido fraudulento o cualquier actividad contraria a la ley.
            También se prohíbe intentar acceder sin autorización a áreas
            restringidas del sistema, alterar el código, interferir con la
            infraestructura tecnológica o realizar cualquier acción que
            comprometa la seguridad del servicio.
          </p>

          <p>
            La Plataforma no será responsable por incumplimientos o retrasos
            derivados de causas de fuerza mayor, incluyendo, entre otros,
            desastres naturales, fallas masivas de internet, ataques
            cibernéticos, actos gubernamentales, conflictos laborales,
            interrupciones de proveedores tecnológicos o cualquier circunstancia
            fuera de su control razonable.
          </p>

          <p>
            La Plataforma podrá modificar en cualquier momento los presentes
            Términos y Condiciones. Las modificaciones entrarán en vigor una vez
            publicadas en el sitio web. El uso continuado del servicio después
            de la publicación de cambios constituirá aceptación de los mismos.
          </p>

          <p>
            En relación con la protección de datos, La Plataforma almacenará
            únicamente la información necesaria para la prestación del servicio
            y no comercializará dicha información con terceros. Se aplicarán
            medidas de seguridad razonables acordes con la naturaleza del
            servicio, sin que ello implique garantía absoluta frente a accesos
            no autorizados.
          </p>

          <p>
            Para la interpretación y ejecución del presente acuerdo, las partes
            se someten a las leyes aplicables y a la jurisdicción de los
            tribunales competentes en Cagua, Estado Aragua, Venezuela,
            renunciando expresamente a cualquier otro fuero que pudiera
            corresponderles.
          </p>
        </main>

        <footer className="mt-20 pt-8 border-t border-zinc-200 text-center">
          <p className="text-zinc-400 text-sm">
            © {new Date().getFullYear()} [Nombre de la Plataforma]. Todos los
            derechos reservados.
          </p>
        </footer>
      </div>
    </div>
  );
}
