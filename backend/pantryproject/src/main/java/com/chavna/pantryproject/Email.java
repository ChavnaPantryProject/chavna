package com.chavna.pantryproject;

import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.sesv2.SesV2Client;
import software.amazon.awssdk.services.sesv2.model.Body;
import software.amazon.awssdk.services.sesv2.model.Content;
import software.amazon.awssdk.services.sesv2.model.CreateEmailIdentityRequest;
import software.amazon.awssdk.services.sesv2.model.Destination;
import software.amazon.awssdk.services.sesv2.model.EmailContent;
import software.amazon.awssdk.services.sesv2.model.Message;
import software.amazon.awssdk.services.sesv2.model.SendEmailRequest;

public class Email {
    private static SesV2Client client = SesV2Client.builder()
        .region(Region.US_EAST_1)
        .build();
        
    public static void verifyEmailAddress(String email) {
        CreateEmailIdentityRequest request = CreateEmailIdentityRequest.builder()
            .emailIdentity(email)
            .build();
        
        client.createEmailIdentity(request);
    }

    public static void sendEmail(String from, String to, String htmlContent, String subject) {
        Destination dest = Destination.builder()
            .toAddresses(to)
            .build();

        Content content = Content.builder()
            .data(htmlContent)
            .build();

        Content sub = Content.builder()
            .data(subject)
            .build();

        Body body = Body.builder()
            .html(content)
            .build();
        
        Message message = Message.builder()
            .subject(sub)
            .body(body)
            .build();

        EmailContent email = EmailContent.builder()
            .simple(message)
            .build();

        SendEmailRequest emailRequest = SendEmailRequest.builder()
            .destination(dest)
            .content(email)
            .fromEmailAddress(from)
            .build();

        client.sendEmail(emailRequest);
    }
}
