// src/types/order.ts
// Sistema de Tres Menús — resolución de modo de pedido (docs/DESIGN.md §9)
// Se calcula en el servidor (app/menu/[slug]/page.tsx) y se pasa a las UIs.

export type OrderMode = 'whatsapp' | 'table' | 'waiter' | 'view'

export type OrderContext = {
    /**
     * - 'whatsapp': URL sin query → menú actual (pedido a WhatsApp + panel)
     * - 'table':    ?mesa=<qrToken> sin sesión de mesero → solo panel
     * - 'waiter':   ?mesa=<qrToken> con sesión de mesero → solo panel
     * - 'view':     ?mesa=<qrToken>&ver=1 sin sesión de mesero → SOLO LECTURA
     *               (QR "solo ver carta": sin carrito ni agregar; tocar un
     *               producto abre el modal de visualización; los pedidos los
     *               hace el mesero desde su panel). Si hay sesión de mesero
     *               gana 'waiter' (el mesero siempre puede pedir).
     *
     * Caso especial: hay sesión de mesero pero NO hay query 'mesa'
     * → mode = 'whatsapp' + waiter != null + table = null (el pedido queda
     *    bloqueado hasta que el mesero elija una mesa; ver OrderModeBar).
     */
    mode: OrderMode
    table: { id: string; number: string; qrToken: string } | null
    waiter: { id: string; name: string } | null
}
