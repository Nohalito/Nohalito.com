export function calculateAge(birthDate) {
  const birth = new Date(birthDate)
  const today = new Date()

  let age = today.getFullYear() - birth.getFullYear()
  const birthdayHasOccurredThisYear =
    today.getMonth() > birth.getMonth() ||
    (today.getMonth() === birth.getMonth() && today.getDate() >= birth.getDate())

  if (!birthdayHasOccurredThisYear) age -= 1

  return age
}
