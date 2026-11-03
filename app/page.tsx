'use client';

import { useEffect, useState } from 'react';
import { isRegistrationClosed, REGISTRATION_CUTOFF } from '@/lib/registration';

const photos = [
  ['covirenas.jpg', 'COVIRENAS'],
  ['brif.jpg', 'BRIF'],
<<<<<<< HEAD
  ['uea.jpg', 'Educación Ambiental'],
  ['montezuma.jpg', 'Montezuma'],
  ['tortuguero.jpg', 'Tortuguero'],
  ['general.jpeg', 'Voluntariado general'],
=======
  ['uea.jpg', 'UEA · Stop Animal Selfies'],
  ['montezuma.jpg', 'Montezuma'],
  ['tortuguero.jpg', 'Tortuguero'],
  ['reforestacion.jpg', 'Voluntariado general'],
>>>>>>> main
];

const closedMessage =
  'Las inscripciones cerraron el 30 de noviembre. Si ya te inscribiste, los comprobantes pendientes seguirán en revisión.';

export default function Home() {
  const [status, setStatus] = useState('');
  const [code, setCode] = useState('');
  const [closed, setClosed] = useState(false);

  useEffect(() => {
    const update = () => setClosed(isRegistrationClosed());
    update();

    const timeout = window.setTimeout(
      update,
      Math.max(REGISTRATION_CUTOFF - Date.now(), 0),
    );

    return () => window.clearTimeout(timeout);
  }, []);

  async function send(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus('Enviando…');

    try {
      const r = await fetch('/api/register', {
        method: 'POST',
        body: new FormData(e.currentTarget),
      });
      const j = await r.json();

      if (!r.ok) {
        if (r.status === 410) setClosed(true);
        throw Error(j.error);
      }

      setCode(j.id);
      setStatus('success');
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Error de envío');
    }
  }

  return (
    <main>
      <header>
        <img src='/logo-asvo.png' alt='ASVO' />
        <b>FIESTA ASVO 2026</b>
        <a href='#registro'>¡Me apunto! ↗</a>
      </header>

      <section className='hero'>
        <div className='hero-copy'>
          <span className='eyebrow'>✦ ¡ES HORA DE CELEBRAR! ✦</span>
          <h1>
            ¡La fiesta <em>es nuestra!</em>
          </h1>
          <p>
            Después de tantas aventuras, llegó el momento de compartir, bailar
            y celebrar a quienes hacen posible ASVO.
          </p>
          <div className='date'>
            📅 SÁBADO 5 DE DICIEMBRE
            <br />
            🕑 2:00 p. m. – 8:00 p. m.
            <br />
            📍 La FOS · Oficina de ASVO
          </div>
          <a className='cta' href='#registro'>
            🎉 ¡Quiero participar!
          </a>
          <small>Exclusiva para personas voluntarias · Sin acompañantes</small>
        </div>
        <img
          className='hero-image'
          src='/photos/hero-grupo.jpg'
          alt='Personas voluntarias ASVO'
        />
      </section>

      <div className='ticker'>
        🎶 MÚSICA　✦　💃 BAILE　✦　🎱 BINGO　✦　🫔 TAMALES　✦　🎁 PREMIOS　
        ✦　¡Y MÁS SORPRESAS!
      </div>

      <section className='gallery'>
        <span className='eyebrow'>NUESTRA GENTE, NUESTRO ORGULLO</span>
        <h2>
          Momentos que <em>nos unen.</em>
        </h2>
        <p>Desde las aulas hasta el bosque y el mar: ¡este encuentro es para ustedes!</p>
        <div className='grid'>
          {photos.map(([file, title]) => (
            <figure key={file}>
              <img
                src={'/photos/' + file}
                alt={title}
                loading='lazy'
              />
              <figcaption>{title}</figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section className='activities'>
        <h2>
          Una tarde para <em>celebrarnos.</em>
        </h2>
        <div>
          🎶 Música　 💃 Baile　 🎱 Bingo　 🫔 Tamales　 🎁 Premios
        </div>
        <p>✨ ¡Y muchas sorpresas más! ✨</p>
      </section>

      <section className='register' id='registro'>
        {closed ? (
          <div className='registration-closed' role='status'>
            <span className='eyebrow'>INSCRIPCIONES CERRADAS</span>
            <h2>¡Gracias por tu interés!</h2>
            <p>{closedMessage}</p>
          </div>
        ) : (
          <>
            <div className='payment-info'>
              <span className='eyebrow'>RESERVÁ TU LUGAR</span>
              <h2>
                ¡Nos vemos <em>en la fiesta!</em>
              </h2>
              <p>
                Inscripciones hasta el <b>30 de noviembre de 2026</b>.
              </p>
              <div className='price'>
                <small>CUOTA POR PERSONA</small>
                <strong>₡5.000</strong>
              </div>
              <h3>💳 Opción de pago</h3>
              <div className='pay'>
                <b>SINPE Móvil</b>
                <code>8967 0829</code>
                <button onClick={() => navigator.clipboard.writeText('89670829')}>
                  Copiar
                </button>
              </div>
              <p className='legal'>
                <b>Titular:</b> Maria José Castro Cerdas
              </p>
            </div>

            <div className='formbox'>
              {status === 'success' ? (
                <div className='success'>
                  <h2>🎊 ¡Inscripción recibida!</h2>
                  <p>
                    Tu comprobante quedó pendiente de verificación. Te
                    avisaremos por correo cuando se confirme el pago.
                  </p>
                  <b>Código: {code}</b>
                </div>
              ) : (
                <>
                  <h2>🎟️ Inscribite aquí</h2>
                  <p>Completá tus datos y adjuntá el comprobante.</p>
                  <form onSubmit={send}>
                    <label>
                      Nombre completo *
                      <input
                        name='name'
                        required
                        maxLength={140}
                        autoComplete='name'
                      />
                    </label>
                    <label>
                      Correo electrónico *
                      <input
                        name='email'
                        type='email'
                        required
                        maxLength={180}
                      />
                    </label>
                    <label>
                      WhatsApp *
                      <input name='phone' required minLength={8} />
                    </label>
                    <label>
                      Método de pago
                      <input type='hidden' name='method' value='SINPE' />
                      <span>SINPE Móvil</span>
                    </label>
                    <label>
                      Referencia del pago *
                      <input name='reference' required maxLength={100} />
                    </label>
                    <label>
                      Comprobante de pago *
                      <input
                        name='receipt'
                        type='file'
                        accept='.jpg,.jpeg,.png,.pdf'
                        required
                      />
                      <small>JPG, PNG o PDF · Máximo 4 MB</small>
                    </label>
                    <label className='check'>
                      <input
                        type='checkbox'
                        name='volunteer'
                        value='yes'
                        required
                      />
                      Confirmo que soy una persona voluntaria de ASVO.
                    </label>
                    <label className='check'>
                      <input
                        type='checkbox'
                        name='consent'
                        value='yes'
                        required
                      />
                      Autorizo el tratamiento de mis datos y comprobante para
                      gestionar esta inscripción.
                    </label>
                    <div className='hidden'>
                      <input name='website' tabIndex={-1} />
                    </div>
                    {status && (
                      <p role='alert' className='error'>
                        {status}
                      </p>
                    )}
                    <button
                      className='cta'
                      type='submit'
                      disabled={status === 'Enviando…'}
                    >
                      Enviar inscripción 🎉
                    </button>
                    <small>
                      La inscripción queda confirmada solamente al aprobarse
                      el pago.
                    </small>
                  </form>
                </>
              )}
            </div>
          </>
        )}
      </section>

      <footer>
        <span>💚 Conservamos juntos. ¡Celebramos juntos!</span>
        <a href='/admin'>Administración</a>
      </footer>
    </main>
  );
}
