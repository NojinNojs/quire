import subprocess
import threading
from http.server import BaseHTTPRequestHandler, HTTPServer
import unittest
from unittest.mock import patch

import db_smoke
import db_smoke_resources


class SmokeTeardownTests(unittest.TestCase):
    def setUp(self):
        self.variables = {"VITE_SUPABASE_URL": "http://127.0.0.1:54321", "VITE_SUPABASE_ANON_KEY": "anon"}
        self.status = {"API_URL": "http://127.0.0.1:54321", "ANON_KEY": "anon", "SERVICE_ROLE_KEY": "service"}

    def test_failed_login_cleans_created_user(self):
        users = set()
        requests = []

        class Handler(BaseHTTPRequestHandler):
            def log_message(self, format, *args):
                pass

            def do_POST(self):
                requests.append(("POST", self.path))
                self.rfile.read(int(self.headers["Content-Length"]))
                if self.path == "/auth/v1/admin/users":
                    users.add("created-id")
                    self.send_response(201)
                    self.end_headers()
                    self.wfile.write(b'{"id":"created-id"}')
                else:
                    self.send_response(401)
                    self.end_headers()
                    self.wfile.write(b'{}')

            def do_DELETE(self):
                requests.append(("DELETE", self.path))
                users.remove(self.path.rsplit("/", 1)[-1])
                self.send_response(204)
                self.end_headers()

        with HTTPServer(("127.0.0.1", 0), Handler) as server:
            thread = threading.Thread(target=server.serve_forever, daemon=True)
            thread.start()
            base = f"http://127.0.0.1:{server.server_port}"
            variables = {**self.variables, "VITE_SUPABASE_URL": base}
            status = {**self.status, "API_URL": base}
            try:
                with patch.object(db_smoke, "env", return_value=variables), \
                     patch.object(db_smoke, "status", return_value=status):
                    with self.assertRaises(KeyError):
                        db_smoke.main()
            finally:
                server.shutdown()
                thread.join()
        self.assertEqual(users, set())
        self.assertEqual(requests, [
            ("POST", "/auth/v1/admin/users"),
            ("POST", "/auth/v1/token?grant_type=password"),
            ("DELETE", "/auth/v1/admin/users/created-id"),
        ])

    def test_cleanup_attempts_every_user_after_failures(self):
        responses = [subprocess.CompletedProcess([], 0, "500", ""), OSError("unavailable"),
                     subprocess.CompletedProcess([], 0, "204", "")]
        with patch.object(db_smoke_resources.subprocess, "run", side_effect=responses) as run:
            with self.assertRaisesRegex(RuntimeError, "first.*second"):
                db_smoke_resources.cleanup_users("http://127.0.0.1:54321", "service", ["first", "second", "third"])
        self.assertEqual(run.call_count, 3)
        for invocation, user_id in zip(run.call_args_list, ["first", "second", "third"]):
            self.assertIn(f"http://127.0.0.1:54321/auth/v1/admin/users/{user_id}", invocation.args[0])

    def test_rejects_hosted_or_mismatched_configuration_before_creation(self):
        cases = [
            ({**self.variables, "VITE_SUPABASE_URL": "https://example.com"},
             {**self.status, "API_URL": "https://example.com"}),
            ({**self.variables, "VITE_SUPABASE_ANON_KEY": "other"}, self.status),
            ({**self.variables, "VITE_SUPABASE_URL": "http://localhost:54321"}, self.status),
        ]
        for variables, status in cases:
            with self.subTest(variables=variables), patch.object(db_smoke, "env", return_value=variables), \
                 patch.object(db_smoke, "status", return_value=status), patch.object(db_smoke, "post") as post:
                with self.assertRaises(ValueError):
                    db_smoke.main()
                post.assert_not_called()


if __name__ == "__main__":
    unittest.main()
