import { vapiPost } from "./vendorProxy";

const ELLIOTT_ID = process.env.TEST_ELLIOTT_ASSISTANT_ID || "c303d993-bf42-4784-a8cb-247477b1cbdd";

const TEST_CONTACTS = {
  duane: { name: "Duane Wells", phone: process.env.TEST_DUANE_PHONE || "+14126546500", email: process.env.TEST_DUANE_EMAIL || "" },
  durran: { name: "Durran Cage", phone: process.env.TEST_DURRAN_PHONE || "+17313946907", email: process.env.TEST_DURRAN_EMAIL || "" },
};

export async function testVapiOutboundCall() {
  console.log("\n=== T1.1: VAPI Outbound Call — Elliott → Duane Wells ===");
  console.log("Initiating outbound call from Elliott to Duane Wells...");

  try {
    const callPayload = {
      assistantId: ELLIOTT_ID,
      customer: {
        number: TEST_CONTACTS.duane.phone,
        name: TEST_CONTACTS.duane.name,
      },
      metadata: {
        test: true,
        purpose: "communications-observability-test",
      },
    };

    const result = await vapiPost("/call", callPayload);
    console.log("[PASS] Call initiated successfully");
    console.log("  Call ID:", result.id);
    console.log("  Status:", result.status);
    console.log("  Created:", result.createdAt);
    return { success: true, callId: result.id, result };
  } catch (err: any) {
    console.error("[FAIL] VAPI call failed:", err.message);
    return { success: false, error: err.message };
  }
}

export async function testVapiAgentToAgentCall() {
  console.log("\n=== T1.1b: VAPI Agent-to-Agent — Elliott → Christine ===");
  console.log("Elliott calls Christine (Serra Honda test agent) for scripted conversation...");

  try {
    const callPayload = {
      assistantId: ELLIOTT_ID,
      customer: {
        number: TEST_CONTACTS.durran.phone,
        name: "Christine Test",
      },
      metadata: {
        test: true,
        purpose: "agent-to-agent-appointment-scheduling",
      },
    };

    const result = await vapiPost("/call", callPayload);
    console.log("[PASS] Agent-to-agent call initiated");
    console.log("  Call ID:", result.id);
    console.log("  Status:", result.status);
    return { success: true, callId: result.id, result };
  } catch (err: any) {
    console.error("[FAIL] Agent-to-agent call failed:", err.message);
    return { success: false, error: err.message };
  }
}

export async function testServiceCampaignCreation(authToken: string, baseUrl: string) {
  console.log("\n=== T3: Service Campaign Test ===");

  const serraHondaOrgId = process.env.TEST_ORG_ID || "a9f40650-dc8e-4a86-b0b6-5b94ea5b63ee";

  try {
    console.log("T3.1: Creating service campaign...");
    const campaignRes = await fetch(`${baseUrl}/api/campaigns`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        name: "Comms Test — Service Recall Campaign",
        department: "service",
        channel: "sms",
        messageTemplate:
          "Hi {{customerName}}, this is Serra Honda. Your vehicle may be due for scheduled maintenance. Reply YES to schedule or call us at (901) 203-8267.",
        status: "draft",
      }),
    });

    if (!campaignRes.ok) {
      throw new Error(`Campaign creation failed: ${campaignRes.status} ${await campaignRes.text()}`);
    }

    const campaign = await campaignRes.json();
    console.log("[PASS] Campaign created:", campaign.id);

    console.log("T3.1b: Uploading CSV recipients...");
    const csvContent = [
      "First Name,Last Name,Home Phone,Email",
      "Duane,Wells,4126546500,duanewells@icloud.com",
      "Durran,Cage,7313946907,durran@cageautomotive.com",
    ].join("\n");

    const formData = new FormData();
    formData.append("file", new Blob([csvContent], { type: "text/csv" }), "test-recipients.csv");

    const uploadRes = await fetch(`${baseUrl}/api/campaigns/${campaign.id}/upload-csv`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
      body: formData,
    });

    if (!uploadRes.ok) {
      const errText = await uploadRes.text();
      console.log("[WARN] CSV upload response:", errText);
    } else {
      const uploadResult = await uploadRes.json();
      console.log("[PASS] CSV uploaded:", JSON.stringify(uploadResult));
    }

    return { success: true, campaignId: campaign.id };
  } catch (err: any) {
    console.error("[FAIL] Campaign test failed:", err.message);
    return { success: false, error: err.message };
  }
}

export async function verifyConversationsInTeambox(authToken: string, baseUrl: string) {
  console.log("\n=== T5: TeamBox Observability ===");

  try {
    const res = await fetch(`${baseUrl}/api/conversations`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    const conversations = await res.json();
    const channels = new Set(conversations.map((c: any) => c.channel));
    const recentTestConvos = conversations.filter(
      (c: any) =>
        c.customerName === "Duane Wells" ||
        c.customerName === "Website Visitor" ||
        c.channel === "form" ||
        c.channel === "video"
    );

    console.log(`Total conversations: ${conversations.length}`);
    console.log(`Active channels: ${[...channels].join(", ")}`);
    console.log(`Test-related conversations: ${recentTestConvos.length}`);

    recentTestConvos.forEach((c: any) => {
      console.log(`  ${c.id.substring(0, 8)} | ${c.customerName} | ${c.channel} | ${c.status}`);
    });

    return { success: true, totalConvos: conversations.length, testConvos: recentTestConvos.length, channels: [...channels] };
  } catch (err: any) {
    console.error("[FAIL] TeamBox verification failed:", err.message);
    return { success: false, error: err.message };
  }
}

export async function runAllCommsTests() {
  const baseUrl = "http://localhost:5000";
  console.log("╔════════════════════════════════════════════════════════╗");
  console.log("║   Nexxus Connect — Communications Observability Test  ║");
  console.log("║   Target: Serra Honda (Imposter Agents)               ║");
  console.log("╚════════════════════════════════════════════════════════╝");

  const testEmail = process.env.TEST_AUTH_EMAIL;
  const testPassword = process.env.TEST_AUTH_PASSWORD;
  if (!testEmail || !testPassword) {
    console.error("FATAL: Set TEST_AUTH_EMAIL and TEST_AUTH_PASSWORD env vars. Aborting.");
    return;
  }
  const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: testEmail, password: testPassword }),
  });
  const loginData = await loginRes.json();
  const token = loginData.accessToken;

  if (!token) {
    console.error("FATAL: Could not authenticate. Aborting tests.");
    return;
  }
  console.log("[AUTH] Authenticated as Duane Wells\n");

  console.log("--- T2.1: Form Widget ---");
  const formRes = await fetch(`${baseUrl}/api/widget/contact`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: TEST_CONTACTS.duane.name,
      email: TEST_CONTACTS.duane.email || "test@example.com",
      phone: TEST_CONTACTS.duane.phone.replace("+1", ""),
      message: "Interested in scheduling a test drive for the 2026 Accord",
      slug: "serra-honda",
    }),
  });
  const formData = await formRes.json();
  console.log(formData.success ? "[PASS]" : "[FAIL]", "Form widget:", formData.conversationId || formData.message);

  console.log("\n--- T2.2: Chat Widget ---");
  const chatRes = await fetch(`${baseUrl}/api/widget/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      slug: "serra-honda",
      message: "What financing options do you have for the 2026 Civic?",
      visitorName: "Duane Wells",
      visitorEmail: "duanewells@icloud.com",
    }),
  });
  const chatData = await chatRes.json();
  console.log(chatData.conversationId ? "[PASS]" : "[FAIL]", "Chat widget:", chatData.conversationId);
  if (chatData.response) console.log("  AI Reply:", chatData.response.substring(0, 150) + "...");

  console.log("\n--- T2.4: Voice Config ---");
  const voiceRes = await fetch(`${baseUrl}/api/widget/voice-config/serra-honda`);
  const voiceData = await voiceRes.json();
  const expectedChristine = "d019ff3d-201b-4e2b-bf6a-590c19569fc8";
  console.log(
    voiceData.vapiAssistantId === expectedChristine ? "[PASS]" : "[FAIL]",
    "Voice config returns Christine:",
    voiceData.vapiAssistantId
  );

  console.log("\n--- T4.1: Tavus Video Session ---");
  const videoRes = await fetch(`${baseUrl}/api/widget/video-session`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      widgetCode: "wgt_serra_marketing_unified",
      visitorName: "Duane Wells",
    }),
  });
  const videoData = await videoRes.json();
  console.log(videoData.conversationUrl ? "[PASS]" : "[FAIL]", "Tavus session:", videoData.conversationUrl || videoData.message);

  console.log("\n--- T3: Service Campaign ---");
  const campaignResult = await testServiceCampaignCreation(token, baseUrl);

  console.log("\n--- T5: TeamBox Observability ---");
  await verifyConversationsInTeambox(token, baseUrl);

  console.log("\n╔════════════════════════════════════════════════════════╗");
  console.log("║   Test Summary                                        ║");
  console.log("╚════════════════════════════════════════════════════════╝");
  console.log("T2.1 Form Widget:   ", formData.success ? "PASS ✓" : "FAIL ✗");
  console.log("T2.2 Chat Widget:   ", chatData.conversationId ? "PASS ✓" : "FAIL ✗");
  console.log("T2.4 Voice Config:  ", voiceData.vapiAssistantId === expectedChristine ? "PASS ✓" : "FAIL ✗");
  console.log("T4.1 Tavus Session: ", videoData.conversationUrl ? "PASS ✓" : "FAIL ✗");
  console.log("T3   Campaign:      ", campaignResult.success ? "PASS ✓" : "FAIL ✗");
}
