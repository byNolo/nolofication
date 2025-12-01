Here is **one clean, concise, complete outline** of everything we decided for your new **centralized notification service** project.

---

# ✅ **byNolo Notification Service — Final Project Outline**

## **1. Overall Concept**

A **standalone microservice** responsible for delivering notifications to users across *all* byNolo projects.
Authentication/identity handled via **KeyN**.
All other services (Vinyl Vote, SideQuest, KeyN, byNolo Home, etc.) communicate with this Notification Service via an API.

---

# **2. Notification Channels (MVP + Optional)**

### **Core Channels (launch version)**

* **Email**
* **Web Push**
* **Discord (DM or server webhook)**
* **Generic Webhooks** (for future integrations)

### **Optional / future**

* **SMS** (Twilio or similar; not free long-term, but easy to implement)
* **In-app feed** per project
* **Mobile app push** (if you ever have a mobile wrapper)

---

# **3. Frontend vs Backend**

### **Backend**

* Built with **Flask**.
* Exposes REST API endpoints for:

  * sending notifications
  * managing preferences (site-specific + global)
  * registering sites
  * admin controls
* sqlite database
* gunicorn server

### **Frontend**

* Vite, React, TailwindCSS(newest version)

Provides:

1. **Global Notification Hub**

   * Users can edit preferences for **all** sites in one place.
   * Shows a unified notification history (optional future feature).

2. **Site-Specific Preference Page**

   * Any byNolo project can link users to:
     `https://nolofication.bynolo.ca/sites/<site_id>/preferences`
   * Lets users adjust preferences **only for that site**.

---

# **4. API Endpoints (Final List)**

### **User Preferences**

| Method | Endpoint                           | Purpose                             |
| ------ | ---------------------------------- | ----------------------------------- |
| GET    | `/api/preferences`                 | Get global preferences for the user |
| PUT    | `/api/preferences`                 | Update global preferences           |
| GET    | `/api/sites/{site_id}/preferences` | Get preferences for a specific site |
| PUT    | `/api/sites/{site_id}/preferences` | Update preferences for a site       |

---

### **Notification Sending**

| Method | Endpoint                      | Purpose                                                           |
| ------ | ----------------------------- | ----------------------------------------------------------------- |
| POST   | `/api/sites/{site_id}/notify` | Site sends a notification request (delivered via chosen channels) |

**Note:** backend handles formatting + dispatching to email, webhook, Discord, etc.

---

### **Site Registration**

| Method | Endpoint               | Purpose                           |
| ------ | ---------------------- | --------------------------------- |
| POST   | `/api/sites/register`  | Register a new site using API key |
| GET    | `/api/sites`           | View sites (admin only)           |
| DELETE | `/api/sites/{site_id}` | Remove site (admin only)          |

---

# **5. Security Architecture**

### **Site Authentication**

* **Per-site API key** generated once and given to trusted sites.
* Registration requires:

  * valid API key
  * approval in admin panel (optional but recommended)

### **Transport Security**

* 100% **HTTPS-only** for all endpoints
* All secrets kept in environment variables

### **Data Protection**

* Store minimum possible user data
* Encrypt sensitive fields at rest (optional)
* Rate limit:

  * notification send endpoint
  * registration endpoint

### **User Authentication**

* All preference endpoints require **KeyN JWT** verification.

---

# **6. User Preferences Model**

Each user has:

* **Global settings**
* **Per-site overrides**

Example:

```json
{
  "email": true,
  "web_push": false,
  "discord": true,
  "sites": {
    "vinylvote": { "email": false, "web_push": true },
    "sidequest": { "email": true, "discord": false }
  }
}
```

---

# **7. Admin Features**

* Approve/reject new site registrations
* Generate API keys for new sites
* View logs of sent notifications (optional)
* Toggle channels on/off platform-wide

---

# **8. System Flow Summary**

1. User logs in via **KeyN** → obtains JWT
2. A site sends notification → `/api/sites/{site_id}/notify`
3. Notification Service:

   * loads user preferences
   * dispatches to the allowed channels
4. User can modify preferences:

   * globally
   * or per-site

---

# **9. Branding Direction (still undecided)**

* Will **not** be marketed as a major public product
* Should fit aesthetically into the **KeyN ecosystem**
* Branding can evolve later (e.g., KeyN Notify / Nolo Pulse / etc.)

---

# **✓ Final Goal**

A clean, scalable, centralized **Notification Hub** powering all byNolo sites with:

* unified preferences
* secure cross-site communication
* email/web push/Discord/webhooks
* future channel expansion
* admin approval + API key system

