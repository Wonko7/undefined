(ns undefined.auth
  (:use [noir.fetch.remotes]
        [noir.response :only [redirect]]
        [noir.request :only [ring-request]]
        [noir.core :only [pre-route]]
        [undefined.config :only [get-config]])
  (:require [net.cgrand.enlive-html :as html]
            [cemerick.friend :as friend]
            [noir.session :as session]
            [noir.fetch.remotes]
            [digest :as hash-fns]))


;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; auth remotes:
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

(defremote get-user []
  (let [{:keys [username roles]} (friend/current-authentication)]
    [username roles]))

(defremote auth-login [auth]
  (let [{:keys [username roles]} (friend/current-authentication)]
    (friend/authorize #{:undefined.server/admin :undefined.server/peon}
                      [username roles])))

(defremote auth-logout [] nil)

;; FIXME: also check requires-scheme
(pre-route "/login" []
           (let [req       (ring-request)
                 https-url (str "https://" (:server-name req) (str ":" (:ssl-port (get-config))) (:uri req))]
             (when (= :http (:scheme req))
               (redirect https-url))))

(pre-route "/sign-up" []
           (let [req       (ring-request)
                 https-url (str "https://" (:server-name req) (str ":" (:ssl-port (get-config))) (:uri req))]
             (when (= :http (:scheme req))
               (redirect https-url))))


;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; wrappers for undefined:
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

(defn username [id]
  (:username (friend/current-authentication id)))

(defn userid [id]
  (:uid (friend/current-authentication id)))

(defn is-admin? [id]
  (let [{:keys [roles]} (friend/current-authentication id)]
    (:undefined.server/admin roles)))

(defn is-author? [actual-id test-id]
  (= (userid actual-id) test-id))


;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; captcha fun;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;


(defn get-captcha []
  (let [captcha-url (html/html-resource (java.net.URL. (str "http://api.textcaptcha.com/" "demo")))
        captcha     (group-by :tag (html/select captcha-url #{[:question] [:answer]}))
        question    (first (:content (first (:question captcha))))
        answers     (mapcat :content (:answer captcha))]
    [question answers]))

(defremote get-captcha-rem []
  (let [[question answers] (get-captcha)]
    (session/put! :captcha answers)
    question))

(defremote validate-captcha [answer]
  (let [answer (hash-fns/md5 answer)
        valid? (some #(= answer %) (session/get :capcha))]
    (println valid?)
    (println answer (session/get :capcha))))

(get-captcha)
