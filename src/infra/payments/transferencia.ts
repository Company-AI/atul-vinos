import type {
  CheckoutSession, CheckoutSessionInput, PaymentProvider, PreapprovalInput,
  PreapprovalResult, ProviderPayment, ProviderPreapproval, WebhookVerification,
} from "@/domain/payments/ports";

/**
 * Pago por transferencia bancaria.
 *
 * No es una pasarela: nadie cobra nada acá. Lo único que hace es llevar a la
 * persona a la pantalla donde están los datos de la cuenta, y dejar el pedido
 * esperando. Alguien de la bodega mira el banco, ve que entró la plata y lo
 * marca como pagado desde el panel.
 *
 * Por eso no hay webhook ni consulta de estado: no hay a quién preguntarle. Es
 * la diferencia importante con Mercado Pago, donde el pago se da por bueno
 * sólo cuando el proveedor avisa. Acá la confirmación es una persona mirando
 * el extracto, y el sistema no puede ni debe adivinarla.
 */
export class TransferenciaProvider implements PaymentProvider {
  readonly code = "transferencia";
  readonly name = "Transferencia bancaria";

  /*
    Siempre disponible como clase. Que se ofrezca o no en la pantalla de pago
    depende de los datos de la cuenta cargados en Configuración, que es una
    decisión comercial y se revisa ahí, no acá.
  */
  isConfigured(): boolean {
    return true;
  }

  async createCheckoutSession(input: CheckoutSessionInput): Promise<CheckoutSession> {
    return {
      providerCode: this.code,
      preferenceId: null,
      /*
        A la pantalla de estado del propio pedido. Ahí están los datos para
        transferir y el número que hay que poner como referencia.
      */
      redirectUrl: input.pendingUrl,
      sandbox: false,
    };
  }

  private noAplica(operacion: string): never {
    throw new Error(
      `Una transferencia no admite ${operacion}: el dinero no pasa por el sitio. ` +
        `El pedido se confirma a mano desde el panel cuando la plata entra al banco.`,
    );
  }

  async createPreapproval(_input: PreapprovalInput): Promise<PreapprovalResult> {
    // El Club necesita un débito recurrente; una transferencia es un acto único.
    this.noAplica("suscripciones");
  }

  async getPayment(): Promise<ProviderPayment | null> {
    return null;
  }

  async getPreapproval(): Promise<ProviderPreapproval | null> {
    return null;
  }

  async updatePreapprovalStatus(): Promise<void> {
    this.noAplica("suscripciones");
  }

  async refund(): Promise<void> {
    /*
      Una devolución se hace transfiriendo de vuelta, a mano. Lanzar un error
      acá evita que el panel muestre un botón que no devuelve nada y deje a
      alguien creyendo que ya reintegró la plata.
    */
    this.noAplica("devoluciones automáticas");
  }

  verifyWebhook(): WebhookVerification {
    /*
      Nadie legítimo manda avisos de una transferencia. Rechazar en vez de
      aceptar es lo que impide que alguien marque su propio pedido como pago
      llamando a la dirección de los webhooks.
    */
    return { valid: false, reason: "Las transferencias no reciben avisos automáticos." };
  }
}
