package tn.esprit.projet_module.service;

import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import jakarta.mail.internet.MimeMessage;

@Service
public class EmailService {

    private final JavaMailSender mailSender;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void sendProposalAccepted(String toEmail, String freelancerName, String projectTitle, Double bidAmount) {
        sendProposalAccepted(toEmail, freelancerName, projectTitle, bidAmount, null, null);
    }

    public void sendProposalAccepted(String toEmail, String freelancerName, String projectTitle, Double bidAmount,
                                     String clientEmail, String clientName) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setTo(toEmail);
            if (clientEmail != null && !clientEmail.isBlank()) {
                helper.setReplyTo(clientEmail);
            }
            helper.setSubject("Your proposal has been accepted — " + projectTitle);
            helper.setText(buildAcceptedHtml(freelancerName, projectTitle, bidAmount, clientName), true);

            mailSender.send(message);
        } catch (Exception e) {
            System.err.println("Email error: " + e.getMessage());
            e.printStackTrace();
        }
    }

    public void sendProposalSubmitted(String toEmail, String freelancerName, String projectTitle, Double bidAmount) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setTo(toEmail);
            helper.setSubject("Your proposal was submitted — " + projectTitle);
            helper.setText(buildProposalSubmittedHtml(freelancerName, projectTitle, bidAmount), true);

            mailSender.send(message);
        } catch (Exception e) {
            System.err.println("Email error: " + e.getMessage());
            e.printStackTrace();
        }
    }

    public void sendProposalRejected(String toEmail, String freelancerName, String projectTitle) {
        sendProposalRejected(toEmail, freelancerName, projectTitle, null, null);
    }

    public void sendProposalRejected(String toEmail, String freelancerName, String projectTitle,
                                     String clientEmail, String clientName) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setTo(toEmail);
            if (clientEmail != null && !clientEmail.isBlank()) {
                helper.setReplyTo(clientEmail);
            }
            helper.setSubject("Your proposal status — " + projectTitle);
            helper.setText(buildRejectedHtml(freelancerName, projectTitle, clientName), true);

            mailSender.send(message);
        } catch (Exception e) {
            System.err.println("Email error: " + e.getMessage());
            e.printStackTrace();
        }
    }

    private String buildAcceptedHtml(String name, String project, Double amount, String clientName) {
        String fromLine = (clientName != null && !clientName.isBlank())
            ? "<p style=\"margin-top:20px;color:#555;font-size:14px;\">This message is from <strong>" + clientName + "</strong> (project client).</p>"
            : "<p style=\"margin-top:30px;color:#777;font-size:14px;\">The client will contact you soon to begin collaboration.</p>";
        return """
    <div style="background-color:#f4f6f9;padding:40px 0;font-family:'Segoe UI',Arial,sans-serif;">
        <div style="max-width:700px;margin:0 auto;background:#ffffff;border-radius:16px;
                    box-shadow:0 10px 30px rgba(0,0,0,0.08);overflow:hidden;text-align:center;">

            <div style="background:#98AFCF;padding:30px;">
                <h1 style="color:white;margin:0;font-size:26px;">Proposal Accepted</h1>
            </div>

            <div style="padding:40px 50px;">
                <h2 style="color:#98AFCF;margin-bottom:20px;">Congratulations, %s!</h2>
                <p style="font-size:16px;color:#555;line-height:1.6;">
                    Your proposal for the project <strong>%s</strong> has been officially
                    <span style="color:#98AFCF;font-weight:bold;">accepted</span>.
                </p>
                <div style="background:#f8f9fa;padding:25px;border-radius:12px;margin:30px 0;font-size:16px;color:#333;">
                    <p style="margin:5px 0;"><strong>Project:</strong> %s</p>
                    <p style="margin:5px 0;"><strong>Your Bid:</strong> $%.2f</p>
                </div>
                %s
            </div>

            <div style="background:#fafafa;padding:20px;font-size:12px;color:#999;">
                © 2026 PidevFreelancy Platform — All rights reserved
            </div>
        </div>
    </div>
    """.formatted(name, project, project, amount, fromLine);
    }

    private String buildProposalSubmittedHtml(String name, String project, Double amount) {
        return """
    <div style="background-color:#f4f6f9;padding:40px 0;font-family:'Segoe UI',Arial,sans-serif;">
        <div style="max-width:700px;margin:0 auto;background:#ffffff;border-radius:16px;
                    box-shadow:0 10px 30px rgba(0,0,0,0.08);overflow:hidden;text-align:center;">
            <div style="background:#98AFCF;padding:30px;">
                <h1 style="color:white;margin:0;font-size:26px;">Proposal Submitted</h1>
            </div>
            <div style="padding:40px 50px;">
                <h2 style="color:#98AFCF;margin-bottom:20px;">Hello, %s!</h2>
                <p style="font-size:16px;color:#555;line-height:1.6;">
                    Your proposal for the project <strong>%s</strong> has been successfully submitted.
                </p>
                <div style="background:#f8f9fa;padding:25px;border-radius:12px;margin:30px 0;font-size:16px;color:#333;">
                    <p style="margin:5px 0;"><strong>Project:</strong> %s</p>
                    <p style="margin:5px 0;"><strong>Your Bid:</strong> $%.2f</p>
                </div>
                <p style="margin-top:30px;color:#777;font-size:14px;">
                    The client will review your proposal and get back to you soon.
                </p>
            </div>
            <div style="background:#fafafa;padding:20px;font-size:12px;color:#999;">
                © 2026 PidevFreelancy Platform — All rights reserved
            </div>
        </div>
    </div>
    """.formatted(name, project, project, amount);
    }

    private String buildRejectedHtml(String name, String project, String clientName) {
        String fromLine = (clientName != null && !clientName.isBlank())
            ? "<p style=\"margin-top:20px;color:#555;font-size:14px;\">This message is from <strong>" + clientName + "</strong> (project client).</p>"
            : "";
        return """
    <div style="background-color:#f4f6f9;padding:40px 0;font-family:'Segoe UI',Arial,sans-serif;">
        <div style="max-width:700px;margin:0 auto;background:#ffffff;border-radius:16px;
                    box-shadow:0 10px 30px rgba(0,0,0,0.08);overflow:hidden;text-align:center;">

            <!-- HEADER -->
            <div style="background:#98AFCF;padding:30px;">
                <h1 style="color:white;margin:0;font-size:26px;">Proposal Update</h1>
            </div>

            <!-- BODY -->
            <div style="padding:40px 50px;">

                <h2 style="color:#98AFCF;margin-bottom:20px;">
                    Hello, %s
                </h2>

                <p style="font-size:16px;color:#555;line-height:1.6;">
                    Unfortunately, your proposal for 
                    <strong>%s</strong> has been 
                    <span style="color:#98AFCF;font-weight:bold;">not selected</span>.
                </p>

                <p style="margin-top:20px;font-size:15px;color:#666;">
                    Don’t worry! Many other opportunities are waiting for your talent.
                    Keep applying and growing.
                </p>
                %s
            </div>

            <!-- FOOTER -->
            <div style="background:#fafafa;padding:20px;font-size:12px;color:#999;">
                © 2026 PidevFreelancy Platform — Keep pushing forward
            </div>

        </div>
    </div>
    """.formatted(name, project, fromLine);
    }
}