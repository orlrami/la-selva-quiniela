export const authMessages = {
  validation: {
    usernameRequired: "Introduce tu usuario.",
    usernameTooShort: "El usuario debe tener al menos 2 caracteres.",
    usernameTooLong: "El usuario debe tener máximo 30 caracteres.",
    usernameInvalidChars:
      "Usa letras, números, espacios, punto, guion o guion bajo.",
    passwordRequired: "Escribe tu contraseña.",
    passwordTooShort: "La contraseña debe tener al menos 8 caracteres.",
    passwordMissingLetter: "Incluye al menos una letra.",
    passwordMissingNumber: "Incluye al menos un número.",
    tokenRequired: "Pega el código de invitación que te enviaron.",
    tokenInvalidFormat: "El código de invitación no tiene un formato válido.",
  },
  errors: {
    invalidCredentials: "Usuario o contraseña incorrectos.",
    accountAlreadyExists: "Ya hay alguien con ese usuario.",
    inviteNotFound: "Esta invitación no existe o ya no es válida.",
    inviteExpired: "La invitación ha expirado. Pide una nueva al organizador.",
    inviteExhausted: "Esta invitación ya alcanzó su límite de usos.",
    inviteAlreadyUsed: "Esta invitación ya fue utilizada por otra persona.",
    serverError: "Algo salió mal. Inténtalo de nuevo en unos segundos.",
  },
  ui: {
    appName: "La Selva Quiniela",
    tagline: "La quiniela familiar del Mundial 2026.",
    privateBadge: "Quiniela familiar privada",
    loginTitle: "Entra a tu quiniela",
    loginSubtitle:
      "Usa el usuario y la contraseña que elegiste al unirte con tu invitación.",
    loginCta: "Iniciar sesión",
    loginPendingCta: "Entrando…",
    loginNoAccount: "¿Aún no tienes cuenta?",
    loginUseInvite: "Únete con una invitación",
    registerTitle: "Únete con tu invitación",
    registerSubtitle:
      "Elige un usuario y una contraseña. Eso es todo lo que necesitas para empezar.",
    registerCta: "Crear cuenta",
    registerPendingCta: "Creando cuenta…",
    registerAlreadyHaveAccount: "¿Ya tienes cuenta?",
    registerGoToLogin: "Inicia sesión",
    inviteTitle: "Invitación recibida",
    inviteSubtitle:
      "Estás invitado a unirte a la quiniela familiar. Elige tu usuario y contraseña.",
    invitePromptTokenTitle: "¿Tienes un código de invitación?",
    invitePromptTokenSubtitle:
      "Pega el código que te compartieron para acceder al registro.",
    invitePromptTokenCta: "Continuar",
    logout: "Cerrar sesión",
    logoutPending: "Cerrando sesión…",
    fieldUsername: "Usuario",
    fieldUsernamePlaceholder: "Ej. tio.alex",
    fieldUsernameHint:
      "Es tu nombre para iniciar sesión. No distingue mayúsculas ni acentos.",
    fieldPassword: "Contraseña",
    fieldPasswordPlaceholder: "Escribe tu contraseña",
    fieldNewPasswordPlaceholder: "Mínimo 8 caracteres",
    fieldInvite: "Código de invitación",
    fieldInvitePlaceholder: "Pega el código aquí",
    hintNewPassword: "Mezcla letras y números para una contraseña sólida.",
    welcomeBack: "Bienvenido de vuelta",
  },
} as const;

export type AuthMessages = typeof authMessages;
