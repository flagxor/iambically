package main

import (
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"strconv"
	"time"

	"google.golang.org/appengine/datastore"
	"google.golang.org/appengine/user"
)

type Entry struct {
	Committed time.Time
	Content   []byte
}

func fetch(w http.ResponseWriter, r *http.Request) {
	if checkAccount(w, r) {
		return
	}
	start_str := r.FormValue("start")
	q := datastore.NewQuery("Entry").Order("Committed").Limit(10)
	if start, err := strconv.ParseInt(start_str, 10, 64); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	} else {
		q = q.Filter("Committed >", time.Unix(0, start))
	}
	entries := make([]Entry, 0, 10)
	keys, err := q.GetAll(r.Context(), &entries)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "text/plain")
	w.WriteHeader(http.StatusOK)
	fmt.Fprintf(w, "%d\n", len(entries))
	for i, value := range entries {
		fmt.Fprintf(w, "%d %d %s\n",
			len(value.Content), value.Committed.UnixNano(), keys[i].Encode())
		w.Write(value.Content)
	}
}

func commit(w http.ResponseWriter, r *http.Request) {
	if checkAccount(w, r) {
		return
	}
	replaces_str := r.FormValue("replaces")
	var key *datastore.Key
	var err error
	if replaces_str != "" {
		key, err = datastore.DecodeKey(replaces_str)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
	} else {
		key = datastore.NewIncompleteKey(r.Context(), "Entry", nil)
	}
	g := Entry{
		Committed: time.Now(),
		Content:   []byte(r.FormValue("content")),
	}
	key, err = datastore.Put(r.Context(), key, &g)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "text/plain")
	w.WriteHeader(http.StatusOK)
	fmt.Fprintf(w, "%d %s\n", g.Committed.UnixNano(), key.Encode())
}

func auth(w http.ResponseWriter, r *http.Request) {
	if checkAccount(w, r) {
		return
	}
	w.Header().Set("Content-Type", "text/plain")
	w.WriteHeader(http.StatusOK)
	io.WriteString(w, "ok\n")
}

func login(w http.ResponseWriter, r *http.Request) {
	c := r.Context()
	if user.Current(c) == nil {
		url, err := user.LoginURL(c, r.URL.String())
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		w.Header().Set("Location", url)
		w.WriteHeader(http.StatusFound)
		return
	}
	if checkAccount(w, r) {
		return
	}
	w.Header().Set("Content-Type", "text/plain")
	w.WriteHeader(http.StatusOK)
	io.WriteString(w, "ok\n")
}

func logout(w http.ResponseWriter, r *http.Request) {
	c := r.Context()
	if user.Current(c) != nil {
		url, err := user.LogoutURL(c, r.URL.String())
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		w.Header().Set("Location", url)
		w.WriteHeader(http.StatusFound)
		return
	}
	w.Header().Set("Content-Type", "text/plain")
	w.WriteHeader(http.StatusOK)
	io.WriteString(w, "ok\n")
}

func checkAccount(w http.ResponseWriter, r *http.Request) bool {
	u := user.Current(r.Context())
	if u == nil {
		http.Error(w, "login required", http.StatusUnauthorized)
		return true
	} else if user.IsAdmin(r.Context()) || u.Email == "bradnelson@google.com" {
		return false
	} else {
		http.Error(w, "access denied", http.StatusForbidden)
		return true
	}
}

func main() {
	http.HandleFunc("/fetch", fetch)
	http.HandleFunc("/commit", commit)
	http.HandleFunc("/auth", auth)
	http.HandleFunc("/login", login)
	http.HandleFunc("/logout", logout)
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
		log.Printf("Defaulting to port %s", port)
	}
	log.Printf("Listening on port %s", port)
	if err := http.ListenAndServe(":"+port, nil); err != nil {
		log.Fatal(err)
	}
}
