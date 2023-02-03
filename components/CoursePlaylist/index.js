/* react, libs */
import { useQueryClient, useMutation } from 'react-query';
import axios from 'axios';

/* dorothy */
import { useDorothy } from 'dorothy-dna-react';

/* icons */
import Check from './../../components/ui/icons/Check';
import Lock from './../../components/ui/icons/Lock';

/* styles */
import styles from './course_playlist.module.scss';

/* components */
import CourseThumb from '../CourseThumb';

/* commons */
import { Title3, Title6 } from '../ui/titles';
import { useEffect, useState } from 'react';

export default function CoursePlaylist({
  isUserEnrolled,
  isDone,
  hideThumb = false,
  courseClasses,
  currentCourseId,
  currentClassId,
  handleClassChange,
}) {
  const queryClient = useQueryClient();
  const { server } = useDorothy();

  const [textToShow, _textToShow] = useState(null);
  const [nextClass, _nextClass] = useState(null);

  const [playlistHeight, _playlistHeight] = useState(`100vh`);

  const mutations = {
    markAsWatched: useMutation(
      entity => {
        if (!entity.course_id || !entity.class_id) return;
        let endpoint = `${server}learning/course/${entity.course_id}/class/${entity.class_id}/watch`;
        if (entity.watched) {
          /* edit */
          return axios.put(endpoint, entity);
        } else {
          /* insert */
          return axios.post(endpoint, entity);
        }
      },
      { onSuccess: () => queryClient.invalidateQueries('course_classes') },
    ),
  };

  const handleWatched = async (newCourseIdRoute, newClassIdRoute, watched) => {
    await mutations.markAsWatched.mutateAsync({ course_id: newCourseIdRoute, class_id: newClassIdRoute, watched });

    handleClassChange(newCourseIdRoute, newClassIdRoute);
  };

  useEffect(() => {
    _playlistHeight(!hideThumb ? `calc(100vh - 26rem)` : `calc(100vh - 10.5rem)`);
  }, [hideThumb]);

  useEffect(() => {
    if (!courseClasses) return;
    if (courseClasses.length === 0) return;

    let firstClass = courseClasses[0];

    let mostAdvancedClass = courseClasses.filter(course => course.watched).sort((a, b) => b.order_seq - a.order_seq)[0];

    if (!mostAdvancedClass) {
      _nextClass(firstClass);
      return;
    }

    let mostAdvancedClassIndex = courseClasses.findIndex(cl => cl.id === mostAdvancedClass.id);

    let next = courseClasses[mostAdvancedClassIndex + 1];

    _nextClass(!next ? firstClass : next);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseClasses]);

  useEffect(() => {
    _textToShow(handleTextMessage(isUserEnrolled, isDone));
  }, [isUserEnrolled, isDone]);

  const handleTextMessage = (isUserEnrolled, isDone) => {
    let textMessage = 'Continuar';

    if (isDone) textMessage = 'Recomeçar';
    else if (!isUserEnrolled) textMessage = 'Começar';
    return textMessage;
  };

  return (
    <>
      <div className={styles.card_box}>
        {courseClasses && (
          <>
            {!hideThumb && nextClass && (
              <CourseThumb
                textToShow={textToShow}
                showInfo={false}
                thumbImg={nextClass.thumb}
                handleClassChange={() => handleWatched(currentCourseId, nextClass.id, false)}
              />
            )}
            <div className={styles.course_classes} style={{ height: playlistHeight }}>
              {courseClasses.map(cl => (
                <div
                  onClick={() => handleWatched(currentCourseId, cl.id, cl.watched)}
                  className={`row m-0 ${cl.id.toString() === currentClassId ? styles.active : ''}`}
                  key={cl.id}
                >
                  <CourseClass
                    thumb={cl.thumb}
                    title={cl.title}
                    watched={cl.watched}
                    isWatching={cl.id.toString() !== currentClassId}
                  />
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </>
  );
}

const CourseClass = ({ thumb, title, watched, isWatching }) => {
  let icon = watched ? !isWatching ? <div className={styles.is_watching}></div> : <Check /> : <Lock />;

  return (
    <>
      <div className={styles.course_class}>
        <div className={styles.class_status}>
          <span className={`${styles[watched ? 'done' : 'error']}`}>{icon}</span>
        </div>
        <div className={styles.class_thumb}>
          <img src={thumb} className={styles.small_thumb} alt="folhas de um pé de tomate" />
        </div>
        <div className={styles.class_info}>
          <div>
            <Title3>{title}</Title3>
          </div>
          <div>
            <Title6 className={``}>155 visualizações</Title6>
          </div>
        </div>
      </div>
    </>
  );
};
