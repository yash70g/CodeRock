#include <bits/stdc++.h>
using namespace std;

struct Node {
    int data;
    Node* left;
    Node* right;
    Node(int val) : data(val), left(NULL), right(NULL) {}
};

Node* buildTree(vector<int>& nodes) {
    if (nodes.empty()) return NULL;

    Node* root = new Node(nodes[0]);
    queue<Node*> q;
    q.push(root);

    int i = 1;
    while (!q.empty() && i < nodes.size()) {
        Node* curr = q.front();
        q.pop();

        // left child
        if (i < nodes.size() && nodes[i] != -1) { // -1 means NULL
            curr->left = new Node(nodes[i]);
            q.push(curr->left);
        }
        i++;

        // right child
        if (i < nodes.size() && nodes[i] != -1) {
            curr->right = new Node(nodes[i]);
            q.push(curr->right);
        }
        i++;
    }
    return root;
}

// Function to calculate height of tree in terms of edges
int height(Node* root) {
    if (root == NULL) return -1; // height in edges
    return 1 + max(height(root->left), height(root->right));
}

int main() {
    int n;
    cin >> n;
    vector<int> arr(n);
    for (int i = 0; i < n; i++) cin >> arr[i];

    Node* root = buildTree(arr);
    cout << height(root);
    return 0;
}
