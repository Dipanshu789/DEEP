interface User {
  id: number;
  email: string;
  role: "user" | "admin";
  isRegistered?: boolean;
  companyId?: number | null;
}

let currentUser: User | null = null;

export function getCurrentUser(): User | null {
  if (!currentUser) {
    const stored = localStorage.getItem("currentUser");
    if (stored) {
      try {
        currentUser = JSON.parse(stored);
      } catch (error) {
        console.error("Failed to parse stored user:", error);
        localStorage.removeItem("currentUser");
      }
    }
  }
  return currentUser;
}

export function setCurrentUser(user: User | null): void {
  currentUser = user;
  if (user) {
    localStorage.setItem("currentUser", JSON.stringify(user));
  } else {
    localStorage.removeItem("currentUser");
  }
}

export function updateCurrentUser(updates: Partial<User>): void {
  if (currentUser) {
    currentUser = { ...currentUser, ...updates };
    localStorage.setItem("currentUser", JSON.stringify(currentUser));
  }
}

export function clearCurrentUser(): void {
  currentUser = null;
  localStorage.removeItem("currentUser");
}
