"use client"
import ContactList from "./ContactList"
import ChatView from "./ChatView"

export default function Inbox({ conversaciones, activoId, onSeleccionar, onMensajeEnviado, onConvActualizada, loading }) {
  return (
    <div className="eapi-crm">
      <ContactList
        conversaciones={conversaciones}
        activoId={activoId}
        onSeleccionar={onSeleccionar}
        loading={loading}
      />
      <ChatView
        conversacionId={activoId}
        onMensajeEnviado={onMensajeEnviado}
        onConvActualizada={onConvActualizada}
      />
    </div>
  )
}
