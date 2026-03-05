from rag_pipeline import ask_question

print("📚 Legal Document Navigator (Multi-PDF Gemini RAG)")
print("Type 'exit' to quit\n")

while True:
    query = input("Ask a question: ")

    if query.lower() == "exit":
        print("Goodbye 👋")
        break

    answer, sources = ask_question(query)

    print("\nAnswer:\n", answer)
    print("\nSources:", sources, "\n")
