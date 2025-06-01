import firebase_admin
import os
from firebase_admin import credentials, firestore


class FirebaseHandler:
    def __init__(self, rel_path):
        script_dir = os.path.dirname(__file__)
        json_path = os.path.join(script_dir, rel_path)
        # Initialize Firebase application
        cred = credentials.Certificate(json_path)
        firebase_admin.initialize_app(cred)
        self.db = firestore.client()

    def get_document(self, collection_name: str, document_id: str):
        """
        Fetches a document from the Firestore collection.
        :param collection_name: Name of the collection to fetch the document from.
        :param document_id: ID of the document to fetch.
        :return: The document data if found, otherwise None.
        """
        doc = self.db.collection(collection_name).document(document_id).get()
        if doc.exists:
            return doc.to_dict()
        return None

    def get_all_documents(self, collection_name: str):
        """
        Fetches all documents from the specified Firestore collection.
        :param collection_name: Name of the collection to fetch the documents from.
        :return: A list of JSON objects, each representing a document in the collection.
        """
        # If collection_name does not exist, `docs` will be an empty list
        docs = self.db.collection(collection_name).get()
        document_list = []

        for doc in docs:
            document_list.append(doc.to_dict())
        return document_list

    def update_document(self, collection_name: str, document_id: str, data: dict):
        """
        Updates a document in the Firestore collection.
        :param collection_name: Name of the collection to update the document in.
        :param document_id: ID of the document to update.
        :param data: Dictionary containing the data to update.
        """
        self.db.collection(collection_name).document(document_id).update(data)

    def add_document(self, collection_name: str, document_id: str, data: dict):
        """
        Adds a new document to the Firestore collection.
        :param collection_name: Name of the collection to add the document to.
        :param document_id: ID of the document to add.
        :param data: Dictionary containing the data to add.
        """
        self.db.collection(collection_name).document(document_id).set(data)

    def delete_document(self, collection_name: str, document_id: str):
        """
        Deletes a document from the Firestore collection.
        :param collection_name: Name of the collection to delete the document from.
        :param document_id: ID of the document to delete.
        """
        self.db.collection(collection_name).document(document_id).delete()


firebaseHandler = FirebaseHandler('.firebase_cred.json')