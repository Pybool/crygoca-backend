export function validateEmail(email: string) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

export function validatePhone(phoneNumber:string){
    const numericPhoneNumber = phoneNumber.replace(/\D/g, '');
    const nigerianPhoneNumberRegex = /^(?:\+234|0)([789]\d{9})$/;
    return nigerianPhoneNumberRegex.test(numericPhoneNumber);
}

export function validateComment(comment:string, wordLimit=500){
    const trimmedComment = comment.trim();
    const words = trimmedComment.split(/\s+/);
    return words.length <= wordLimit;
}

export function validateBase64Images(base64Images:any[]){
    
    if (!Array.isArray(base64Images)) {
        base64Images = [base64Images]
      }
    function isBase64JPEGImage(str:string) {
        const base64JPEGRegex = /^data:image\/jpeg;base64,([A-Za-z0-9+/=])+$/;
        return base64JPEGRegex.test(str);
      }

      for (const item of base64Images) {
        if (typeof item !== 'string' || !isBase64JPEGImage(item)) {
          return false;
        }
      }
    return true;
}

export const utils = {
  joinStringsWithSpace :((stringsArray:any[])=>{
      return stringsArray.join(" ");
  })
}
