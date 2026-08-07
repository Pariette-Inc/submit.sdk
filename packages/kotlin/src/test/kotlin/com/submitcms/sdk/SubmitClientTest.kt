package com.submitcms.sdk

import kotlin.test.Test
import kotlin.test.assertEquals

class SubmitClientTest {

    @Test
    fun `base url mode ile belirlenir`() {
        assertEquals("https://live.submitcms.com", SubmitClient(SubmitConfig(token = "t")).baseUrl)
        assertEquals(
            "https://dev.submitcms.com",
            SubmitClient(SubmitConfig(token = "t", mode = SubmitMode.TEST)).baseUrl,
        )
    }

    @Test
    fun `acik base url mode'u ezer`() {
        val client = SubmitClient(SubmitConfig(token = "t", baseUrl = "http://localhost:8000/"))
        assertEquals("http://localhost:8000", client.baseUrl)
    }

    /** Laravel iç içe sorguyu `filter[alan][işleç]=değer` olarak bekler. */
    @Test
    fun `ic ice sorgu duzlestirilir`() {
        val flat = SubmitClient.flatten(mapOf("filter" to mapOf("price" to mapOf("gte" to 100)), "page" to 2)).toMap()

        assertEquals("100", flat["filter[price][gte]"])
        assertEquals("2", flat["page"])
    }

    /**
     * Bool'lar `true`/`false` değil `1`/`0` gitmeli — PHP'nin boolean
     * doğrulaması "true" dizesini kabul etmez.
     */
    @Test
    fun `booleanlar bir ve sifir olur`() {
        val flat = SubmitClient.flatten(mapOf("in_stock" to true, "noindex" to false)).toMap()

        assertEquals("1", flat["in_stock"])
        assertEquals("0", flat["noindex"])
    }

    @Test
    fun `listeler dizi parametresi olur`() {
        val flat = SubmitClient.flatten(mapOf("categories" to listOf(3, 7)))

        assertEquals(listOf("categories[]" to "3", "categories[]" to "7"), flat)
    }

    @Test
    fun `null degerler sorguya girmez`() {
        assertEquals(emptyList(), SubmitClient.flatten(mapOf("locale" to null)))
    }
}
