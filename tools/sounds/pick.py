import json,urllib.request,urllib.parse,sys,os,re,time
SP=os.environ.get("SND_WORK") or os.path.expanduser("~/bsy-snd-work"); os.makedirs(SP+"/raw",exist_ok=True); os.makedirs(SP+"/out",exist_ok=True); os.makedirs(SP+"/qc",exist_ok=True)
KEY=os.environ["XC_KEY"]  # never commit the key
REPO=os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
B={b["id"]:b for b in json.load(open(REPO+"/data/birds.json"))["birds"]}
ALT={"goshawk":"Accipiter trivirgatus","cattle_egret":"Bubulcus coromandus"}
def api(q):
    out=[];page=1
    while True:
        u="https://xeno-canto.org/api/3/recordings?"+urllib.parse.urlencode({"query":q,"key":KEY,"per_page":500,"page":page})
        d=json.load(urllib.request.urlopen(u,timeout=60)); out+=d["recordings"]
        if page>=int(d["numPages"]): return out
        page+=1; time.sleep(1)
def secs(l):
    p=[int(x) for x in l.split(":")]; s=0
    for x in p: s=s*60+x
    return s
def cat(t):
    t=t.lower()
    if "drum" in t: return "敲擊"
    if "song" in t and "alarm" not in t.split("song")[0][-8:]: return "唱歌"
    if "alarm" in t: return "警戒"
    if "flight" in t: return "飛行"
    if "begging" in t or "juvenile" in t: return None
    if "call" in t: return "叫聲"
    return None
ORDER_CAT=["唱歌","叫聲","警戒","飛行","敲擊"]
def pick(bid,maxn=5):
    sci=ALT.get(bid,B[bid]["sci"]); g,s=sci.split()[:2]
    recs=[]
    for scope in ["cnt:taiwan",""]:
        rs=api(f'gen:{g} sp:{s} {scope}'.strip())
        rs=[r for r in rs if not re.search(r"licenses/[a-z-]*nd[a-z-]*/",r["lic"]) and r["q"] in "ABC" and 4<=secs(r["length"])<=240 and cat(r["type"])]
        for r in rs: r["_tw"]= r["cnt"]=="Taiwan"
        recs+= [r for r in rs if r["id"] not in {x["id"] for x in recs}]
        if len([r for r in recs if r["_tw"]])>=3: break
    def score(r): return ({"A":0,"B":1,"C":2.2}[r["q"]] + 1.2*min(len(r.get("also") or []),3) + (0 if r["_tw"] else 3) + (0.6 if secs(r["length"])>120 else 0) + (0.8 if r.get("animal-seen")=="no" else 0))
    recs.sort(key=score)
    chosen=[];used_rec={}
    for rnd in range(2):
        for c in ORDER_CAT:
            cand=[r for r in recs if cat(r["type"])==c and r not in chosen]
            if rnd==1: cand=[r for r in cand if c in ("唱歌","叫聲")]
            if len(chosen)>=2: cand=[r for r in cand if len(r.get("also") or [])<2]
            if not cand: continue
            # prefer different recordist on second round
            cand.sort(key=lambda r:(score(r)+(1 if used_rec.get(r["rec"]) else 0)))
            if rnd==1 and score(cand[0])>3.5: continue
            chosen.append(cand[0]); used_rec[cand[0]["rec"]]=1
            if len(chosen)>=maxn: break
        if len(chosen)>=maxn: break
    # keep a stable display order
    chosen.sort(key=lambda r:(ORDER_CAT.index(cat(r["type"])),score(r)))
    return [dict(id=r["id"],cat=cat(r["type"]),type=r["type"],q=r["q"],len=r["length"],rec=r["rec"],lic=r["lic"],loc=r["loc"],cnt=r["cnt"],lat=r["lat"],lon=r["lon"],date=r["date"],also=r.get("also"),file=r["file"],url=r["url"],rmk=(r.get("rmk") or "")[:300]) for r in chosen]
if __name__=="__main__":
    ids=sys.argv[1:]
    res=json.load(open(SP+"/picks.json")) if os.path.exists(SP+"/picks.json") else {}
    for bid in ids:
        res[bid]=pick(bid); print(bid,B[bid]["zh"],[(p["cat"],p["q"],p["len"],p["cnt"][:6],len(p["also"] or [])) for p in res[bid]],flush=True)
        json.dump(res,open(SP+"/picks.json","w"),ensure_ascii=False,indent=1)
