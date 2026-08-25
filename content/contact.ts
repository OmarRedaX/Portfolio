import type { ContactInfo } from "./types";

// No phone field — locked decision: email + contact form + LinkedIn/GitHub only
// (implementation-plan.md §0).
export const contact: ContactInfo = {
  email: "redaomar1999@gmail.com",
  linkedin: "https://www.linkedin.com/in/omar-reda-84342b244/",
  github: "https://github.com/OmarRedaX",
  location: "Cairo, Egypt",
};
