export const EMAIL_TEMPLATES = [
  {
    id: "implementacion",
    label: "🚀 Coordinar Implementación",
    subject: "Seguimiento DH Schools 🚀 - {nombre_colegio}",
    body: `Buenos días {nombre_contacto},

Espero que te encuentres muy bien ✨

Te escribo para coordinar una breve reunión por Meet. En esta charla, podremos conversar sobre el avance de la implementación del Digital Skills Diploma en el colegio. Me gustaría saber si necesitas apoyo en algún aspecto, revisar temas específicos, cómo están progresando los alumnos, y cualquier otra cuestión que consideres relevante.

Para facilitar la organización, comparto el enlace a mi calendario para que puedas elegir el día y horario que mejor te convenga:

Mi calendario 🗓️: https://calendar.app.google/YMvk4PF9BvuEXWeQ9

Quedo a su disposición ante cualquier consulta.

Saludos cordiales,
Ezequiel Muñoz
Mentor | DH Schools.
digitalhouse.com`
  },
  {
    id: "pld",
    label: "✅ Correcciones PLD",
    subject: "Correcciones PLD Playground 👩‍💻 - {nombre_colegio}",
    body: `Buenos días {nombre_contacto},

Espero que te encuentres muy bien ✨

Te escribo para contarte que ya he realizado las correcciones de las actividades entregadas en Playground correspondientes a tu capacitación PLD.

Cualquier consulta quedo a tu disposición.

Saludos cordiales,
Ezequiel Muñoz
Mentor | DH Schools.
digitalhouse.com`
  },
  {
    id: "generico",
    label: "✉️ Email Genérico",
    subject: "Contacto DH Schools ✉️ - {nombre_colegio}",
    body: `Buenos días {nombre_contacto},

Espero que te encuentres muy bien ✨

[Mensaje...]

Saludos cordiales,
Ezequiel Muñoz
Mentor | DH Schools.
digitalhouse.com`
  }
];

export const openGmailCompose = (contact, schoolName, template) => {
  const { email, firstName, lastName } = contact;
  const fullName = `${firstName || ""} ${lastName || ""}`.trim() || "Contacto";
  
  let subject = template.subject
    .replace("{nombre_colegio}", schoolName);
    
  let body = template.body
    .replace("{nombre_contacto}", fullName)
    .replace("{nombre_colegio}", schoolName);

  const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(email)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  
  window.open(gmailUrl, "_blank");
};
