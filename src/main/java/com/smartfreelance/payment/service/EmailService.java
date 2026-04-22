package com.smartfreelance.payment.service;

import java.io.IOException;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.Year;
import java.time.format.DateTimeFormatter;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

@Service
public class EmailService {

    private final JavaMailSender mailSender;
    private final String from;

    public EmailService(JavaMailSender mailSender,
                        @Value("${app.mail.from:no-reply@smartfreelance.local}") String from) {
        this.mailSender = mailSender;
        this.from = from;
    }

    public void sendVipUpgradeEmail(String toEmail,
                                   BigDecimal originalAmount,
                                   int discountPercent,
                                   BigDecimal paidAmount,
                                   LocalDate endDate) {
        if (toEmail == null || toEmail.isBlank()) {
            throw new IllegalArgumentException("User email is missing (cannot send receipt)");
        }

        String formattedDate = endDate != null
                ? endDate.format(DateTimeFormatter.ISO_LOCAL_DATE)
                : "N/A";

        String dashboardUrl = "http://localhost:4200/subscription";

        String discountRow = discountPercent > 0
                ? "<tr>" +
                  "<td style=\"padding:8px 0;font-size:13px;color:#6b7280;\">Réduction</td>" +
                  "<td style=\"padding:8px 0;font-size:13px;font-weight:700;text-align:right;\">-" + escapeHtml(String.valueOf(discountPercent)) + "%</td>" +
                  "</tr>"
                : "";

        String html;
        try {
            html = loadTemplate("templates/vip-upgrade.html")
                    .replace("{{customerEmail}}", escapeHtml(toEmail))
                    .replace("{{originalAmount}}", escapeHtml(String.valueOf(originalAmount)))
                    .replace("{{discountRow}}", discountRow)
                    .replace("{{paidAmount}}", escapeHtml(String.valueOf(paidAmount)))
                    .replace("{{endDate}}", escapeHtml(formattedDate))
                    .replace("{{dashboardUrl}}", dashboardUrl)
                    .replace("{{year}}", String.valueOf(Year.now().getValue()));
        } catch (IOException e) {
            throw new IllegalStateException("Failed to load email template", e);
        }

        try {
            MimeMessage mime = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mime, StandardCharsets.UTF_8.name());
            helper.setFrom(from);
            helper.setTo(toEmail);
            helper.setSubject(discountPercent > 0
                    ? "Merci pour votre upgrade VIP (Réduction -" + discountPercent + "%)"
                    : "Merci pour votre upgrade VIP");
            helper.setText(html, true);
            mailSender.send(mime);
        } catch (MessagingException e) {
            throw new IllegalStateException("Failed to send email", e);
        }
    }

    private String loadTemplate(String classpathLocation) throws IOException {
        ClassPathResource res = new ClassPathResource(classpathLocation);
        byte[] bytes = res.getInputStream().readAllBytes();
        return new String(bytes, StandardCharsets.UTF_8);
    }

    /** Minimal HTML escaping (enough for emails). */
    private String escapeHtml(String s) {
        if (s == null) return "";
        return s
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#39;");
    }
}
