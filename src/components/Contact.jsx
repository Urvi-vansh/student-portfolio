import { useState } from "react";

function Contact() {
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");

  return (
    <section id="contact">
      <h2>Contact</h2>
      <p>
        <strong>Email:</strong>{" "}
        <a href="mailto:urvivansh90@gmail.com">urvivansh90@gmail.com</a>
      </p>
      <p>
        <strong>LinkedIn:</strong>{" "}
        <a href="https://www.linkedin.com/in/urvi-vansh-b12906337/" target="_blank" rel="noreferrer">
          urvi-vansh-b12906337
        </a>
      </p>

      <form
        className="contact-form"
        action="https://formsubmit.co/urvivansh90@gmail.com"
        method="POST"
      >
        <input type="hidden" name="_subject" value="New portfolio message" />
        <input type="hidden" name="_template" value="table" />
        <input type="hidden" name="_captcha" value="false" />

        <label htmlFor="name">Your Name</label>
        <input
          id="name"
          name="name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Enter your name"
          required
        />

        <label htmlFor="message">Message</label>
        <textarea
          id="message"
          name="message"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Write a message"
          required
        />

        <button type="submit" className="theme-btn">Send Message</button>

        <p>
          Live preview: <strong>{name || "Your name"}</strong> says {message || "your message"}
        </p>
      </form>
      <hr />
    </section>
  );
}

export default Contact;
