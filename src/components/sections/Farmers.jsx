import { useEffect, useRef, useState } from 'react';
import { navigate } from '../../router';
import { MapPin, ArrowRight, Users, ChevronLeft, ChevronRight, BadgeCheck } from 'lucide-react';
import { listApprovedFarmers, farmerProductTags } from '../../lib/api/farmers';
import { IMG } from '../../data/data';
import Img from '../../components/Img';
import HeartBtn from '../../components/HeartBtn';
import { EmptyState, LoadingBlock, DemoModeNotice } from '../ui/DataState';

export default function Farmers() {
  const carRef = useRef(null);
  const scroll = (d) => carRef.current?.scrollBy({ left: d * 250, behavior: 'smooth' });
  const [rows, setRows] = useState([]);
  const [tagsMap, setTagsMap] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await listApprovedFarmers({ limit: 12 });
      setRows(data || []);
      const tags = {};
      await Promise.all(
        (data || []).map(async (f) => {
          tags[f.user_id] = await farmerProductTags(f.user_id, 3);
        })
      );
      setTagsMap(tags);
      setLoading(false);
    })();
  }, []);

  return (
    <section className="farm-sec">
      <div className="wrap farm-in">
        <div className="farm-l reveal">
          <span className="eyebrow">Meet The Farmers</span>
          <h2 className="with-ic">
            <Users size={24} className="hic" /> Real People. Real Produce.
          </h2>
          <p className="muted">Get to know the hardworking farmers behind your food. Support local. Build a stronger community.</p>
          <button type="button" onClick={() => navigate('/farmers')} className="btn ghost">
            View All Farmers <ArrowRight size={15} />
          </button>
        </div>
        <div className="car-wrap reveal">
          <DemoModeNotice />
          {loading ? (
            <LoadingBlock label="Loading farmers…" />
          ) : !rows.length ? (
            <EmptyState title="No approved farmers yet" message="Approved stalls will appear in this carousel." />
          ) : (
            <>
              <button className="arrow l" type="button" onClick={() => scroll(-1)} aria-label="Previous">
                <ChevronLeft size={18} />
              </button>
              <div className="carousel" ref={carRef}>
                {rows.map((f) => (
                  <div className="fmcard" key={f.id}>
                    <div className="fmimg">
                      <Img src={f.profiles?.avatar_url || IMG.avatar} alt={f.stall_name} />
                      <HeartBtn farmerId={f.user_id} />
                      <span className="vbadge">Verified</span>
                    </div>
                    <div className="fmbody">
                      <b>
                        {f.stall_name} <BadgeCheck size={15} className="vcheck" />
                      </b>
                      <small className="role">{f.contact_person || f.profiles?.full_name || 'Local farmer'}</small>
                      <small>
                        <MapPin size={12} /> {f.profiles?.address || 'Local market'}
                      </small>
                      <div className="tags">
                        {(tagsMap[f.user_id] || []).map((t) => (
                          <span key={t}>{t}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <button className="arrow r" type="button" onClick={() => scroll(1)} aria-label="Next">
                <ChevronRight size={18} />
              </button>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
