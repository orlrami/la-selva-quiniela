export const AVATAR_COLORS = [
  { value: "#1fb6a6", label: "Teal Selva" },
  { value: "#e7bd54", label: "Oro Mundial" },
  { value: "#2bc17a", label: "Verde Bosque" },
  { value: "#e85b3a", label: "Coral" },
  { value: "#9b7ce0", label: "Lavanda" },
  { value: "#5ec8d4", label: "Cielo" },
  { value: "#f06ec3", label: "Magenta" },
  { value: "#7b8794", label: "Pizarra" },
] as const;

export type AvatarColorValue = (typeof AVATAR_COLORS)[number]["value"];

export const AVATAR_COLOR_VALUES = AVATAR_COLORS.map((c) => c.value);

export const profileMessages = {
  page: {
    title: "Tu perfil",
    subtitle:
      "Cambia cómo te ven el resto de la familia en la quiniela. Tu usuario para iniciar sesión no cambia.",
  },
  account: {
    title: "Tu cuenta",
    description:
      "Tu usuario es la identidad que usas para iniciar sesión. No se puede cambiar.",
    fields: {
      username: "Usuario",
      role: "Rol",
      joined: "Te uniste",
    },
  },
  edit: {
    title: "Identidad familiar",
    description:
      "Elige cómo aparece tu nombre en pronósticos, clasificación y panel.",
    nameLabel: "Nombre visible",
    namePlaceholder: "Cómo quieres que te vean",
    nameHint: "Es lo que ven los demás en la quiniela. Mínimo 2 caracteres, máximo 40.",
    avatarLabel: "Color de tu avatar",
    avatarHint: "El color acompaña tus iniciales en cada pantalla.",
    saveCta: "Guardar cambios",
    savingCta: "Guardando…",
    previewLabel: "Vista previa",
  },
  toasts: {
    saved: "Perfil actualizado",
    error: "No se pudo guardar. Inténtalo de nuevo.",
    passwordChanged: "Contraseña actualizada",
  },
  password: {
    title: "Cambiar contraseña",
    description:
      "Para tu seguridad pedimos la contraseña actual antes de cambiarla.",
    currentLabel: "Contraseña actual",
    currentPlaceholder: "Escribe tu contraseña actual",
    newLabel: "Contraseña nueva",
    newPlaceholder: "Mínimo 8 caracteres",
    newHint: "Mezcla letras y números para una contraseña sólida.",
    confirmLabel: "Confirmar contraseña nueva",
    confirmPlaceholder: "Escríbela otra vez",
    saveCta: "Cambiar contraseña",
    savingCta: "Guardando…",
  },
  errors: {
    unauthenticated: "Tu sesión expiró. Vuelve a iniciar sesión.",
    invalidName: "El nombre debe tener entre 2 y 40 caracteres.",
    invalidAvatarColor: "Elige un color del catálogo.",
    currentPasswordRequired: "Escribe tu contraseña actual.",
    currentPasswordWrong: "La contraseña actual no coincide.",
    newPasswordRequired: "Escribe la nueva contraseña.",
    newPasswordTooShort: "La nueva contraseña debe tener al menos 8 caracteres.",
    newPasswordMissingLetter: "Incluye al menos una letra.",
    newPasswordMissingNumber: "Incluye al menos un número.",
    confirmPasswordMismatch: "Las contraseñas no coinciden.",
    server: "Algo salió mal. Inténtalo de nuevo.",
  },
} as const;

export type ProfileMessages = typeof profileMessages;
