import config from '../../config.json';

// Sets the maximum age of a session in seconds.
let MAX_AGE = config.session_max_age // default max age.

if(process.env.SESSION_MAX_AGE && typeof process.env.MAX_AGE === "string") {
    MAX_AGE = parseInt(process.env.SESSION_MAX_AGE)
}

/**
 * Sessions is stored in a map (local memory) per default.
 * Implement a solution of your choice such as storing the sessions
 * in a database.
 */
const sessions = new Map<string, Session>()

/**
 * Sessions class models a session. A session is created with a unique id,
 * a login status of false and a corresponding cookie that contains the id
 * of the session and sets the max age of the cookie.
 *
 * The session removes itself after expiration.
 */
export class Session {
    id:string
    isLoggedIn:boolean
    cookie:string

    constructor() {
        this.id = "" + Bun.hash(`Create session ${sessions.size}`)
        this.isLoggedIn = false
        this.cookie = `id=${this.id}; Max-Age:${MAX_AGE}; SameSite=Strict; HttpOnly`

        // Removes the session from sessions when the cookie expires.
        setTimeout(() => {
            this.delete()
        }, MAX_AGE * 1000)
    }

    /**
     * Deletes the session from the sessions.
     */
    delete() {
        sessions.delete(this.id)
    }
}

export function SyncSession(req:Request):Session {

    const cookies = GetCookies(req)

    if(!cookies) {
        const session = new Session()
        sessions.set(session.id, session)
        return session
    }

    const id = cookies[0].id
    let session = sessions.get(id) // Returns undefined when there is no session with the id.

    if(!session) {
        session = new Session()
        sessions.set(session.id, session)
        return session
    }

    return session
}
/**
 * Extracts all cookies from a request and returns an array of { key: value } objects where each key is the key/id
 * of the cookie and each value is the value of the cookie.
 * @param req Request object
 * @returns An array of { key: value } objects where each key is the key of the cookie and the value
 * is the value of the cookie. If there are no objects the function returns false.
 */
export function GetCookies(req:Request): { [key: string]: string }[] | false {
    // Cookies are of the form <cookie-id>=<cookie-value>
    // If multiple cookies are sent they are separated by a ;
    // Example <cookie-1>=<cookie-value-1> ; <cookie-2>=<cookie-value-2>
    // This function extracts the cookies as objects in an array:
    // [{cookie-id:cookie-value}, {cookie-2:cookie-value-2}, ...,{cookie-id-n:cookie-value-n}]
    const cookies = req.headers.get("cookie")?.split(";")

    if(!cookies) return false

    return cookies.map(cookie => {
        const cookieSplit = cookie.split("=")
        const cookieId = cookieSplit[0]
        const cookieValue = cookieSplit[1]
        return { [cookieId]:cookieValue }
    })
}