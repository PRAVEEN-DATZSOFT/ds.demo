# Media Collaboration System (Java Spring Boot & Vanilla HTML)

This version of your application contains a modern **Spring Boot Java** backend and a pure **HTML/Vanilla JS** frontend that mimics the functionality of the Laravel/React build without relying on complex node or PHP setups locally.

## 🚀 How to Setup the Java Backend
You will need **Java 17 (JDK)** and **Maven** installed on your server environment.

1. Open your terminal inside the `backend` folder.
2. Build the project using Maven:
   ```bash
   mvn clean install
   ```
3. Ensure MySQL is running and you have a database named `media_collab` setup on port 3306. You can edit the database details inside `src/main/resources/application.properties`.
4. Run the Spring Boot Server:
   ```bash
   mvn spring-boot:run
   ```
   *The backend APIs will now be available on `http://localhost:8080/api/`*

## 🌐 How to Setup the HTML Frontend
Since this is a vanilla HTML app with NO build tools required, running it is incredibly simple:

1. Open the `frontend` folder.
2. Open `index.html` directly in your Web Browser (Chrome, Firefox, Edge).
   *No `npm run dev` or local server required!*
3. The JavaScript in `app.js` will automatically use the standard `fetch()` API to connect to the Spring Boot backend securely via JWT authentication.
4. Tailwind CSS styling is loaded directly via CDN in the HTML heads for a perfect modern look.

## 🎉 Features
- **Stateless Auth**: Seamless JWT validation secured by Spring Security.
- **Micro-animations**: Javascript-based manual toasts for modern feedback without heavy UI libraries.
- **Automated Actions**: `@Scheduled` tasks run on a Java Thread to evaluate Media deadlines and disperse database notifications immediately.
