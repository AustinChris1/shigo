package app.shigo.android

// The only apps whose notifications Shigo reads. Keep in step with src/lib/rails/bankapp.ts (the server checks again)
// and the <queries> list in AndroidManifest.xml. Package names checked on Google Play, 2 Oct 2026.
// Never add SMS or messaging apps: anyone can send a fake "you have received" message through them.
object BankApps {
    val ALL: Map<String, String> = linkedMapOf(
        "team.opay.pay" to "OPay",
        "com.moniepoint.personal" to "Moniepoint",
        "com.moniepoint.business" to "Moniepoint Business",
        "com.transsnet.palmpay" to "PalmPay",
        "com.kudabank.app" to "Kuda",
        "com.app.ecobank" to "Ecobank",
        "com.ecobank.mobileapp5" to "Ecobank",
        "com.ecobankbusiness" to "Ecobank Business",
        "com.gtbank.gtworldv1" to "GTWorld",
        "com.zenithBank.eazymoney" to "Zenith Bank",
        "com.accessbank.nextgen" to "Access Bank",
        "com.accessbank.accessbankapp" to "Access Bank",
        "com.firstbank.firstmobile" to "FirstMobile",
        "com.wemabank.alat.prod" to "ALAT",
        "com.uba.vericash" to "UBA",
        "com.fidelitybank.mobile" to "Fidelity Bank",
    )

    // Debug builds post their own test alerts under this name; the live server refuses it.
    const val TEST_APP = "app.shigo.test"
}
